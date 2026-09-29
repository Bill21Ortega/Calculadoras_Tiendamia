// ---- CONFIGURACIÓN MANUAL DE PROTESTAS O PAROS ----
// Si hay una huelga o feriado imprevisto, agrégalo aquí entre comillas y separado por comas.
// Ejemplo: ["2026-10-15", "2026-11-03"]
const FERIADOS_EXTRA_MANUALES = [];

// Códigos de país para la API pública (Nager.Date)
const COUNTRY_CODES = {
    "Uruguay": "UY",
    "Costa Rica": "CR",
    "Peru": "PE",
    "Ecuador": "EC",
    "Argentina": "AR"
};

// Memoria Caché para no saturar la API y hacer que el cálculo sea instantáneo
let cacheFeriados = {};

// ---- Utilidades ----
function pad(n) { return String(n).padStart(2, '0'); }
function toISODate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function fromInputDate(v) {
    if (!v) return null;
    const [y, m, d] = v.split('-').map(Number);
    return new Date(y, m - 1, d, 12, 0, 0); // Siempre al mediodía local para evitar saltos de zona horaria
}

// ---- Conexión con la API ----
async function obtenerFeriadosAPI(pais, anio) {
    const codigo = COUNTRY_CODES[pais];
    if (!codigo) return [];

    const cacheKey = `${codigo}-${anio}`;
    
    // Si ya descargamos los feriados de este país/año en esta sesión, usamos la memoria
    if (cacheFeriados[cacheKey]) return cacheFeriados[cacheKey];

    try {
        const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${anio}/${codigo}`);
        if (!res.ok) throw new Error("Error en respuesta de API");
        
        const data = await res.json();
        const fechas = data.map(feriado => feriado.date); // Extraemos solo las fechas "YYYY-MM-DD"
        
        cacheFeriados[cacheKey] = fechas; // Guardamos en memoria
        return fechas;
    } catch (err) {
        console.error(`⚠️ No se pudieron obtener los feriados de ${pais} para ${anio}:`, err);
        return []; 
    }
}

// ---- Cálculo de entrega ----
async function calcularEntrega(pais, fechaCompraStr, diasHabiles) {
    const fecha = fromInputDate(fechaCompraStr);
    const anioCompra = fecha.getFullYear();

    // 1. Descargamos los feriados del año actual y del próximo (para cruces de fin de año)
    const feriadosAnio1 = await obtenerFeriadosAPI(pais, anioCompra);
    const feriadosAnio2 = await obtenerFeriadosAPI(pais, anioCompra + 1);

    // 2. Unimos los feriados de la API con tus fechas manuales
    const todosLosFeriados = new Set([...feriadosAnio1, ...feriadosAnio2, ...FERIADOS_EXTRA_MANUALES]);

    let restantes = diasHabiles;

    // Iniciar desde el día siguiente a la compra
    fecha.setDate(fecha.getDate() + 1);

    while (restantes > 0) {
        const iso = toISODate(fecha);
        const dow = fecha.getDay(); // 0 = Domingo, 6 = Sábado
        const isWeekend = (dow === 0 || dow === 6);
        const isHoliday = todosLosFeriados.has(iso);

        // Si no es fin de semana ni feriado, descontamos un día hábil
        if (!isWeekend && !isHoliday) {
            restantes--;
        }

        // Avanzamos al siguiente día en el calendario
        if (restantes > 0) {
            fecha.setDate(fecha.getDate() + 1);
        }
    }

    return fecha;
}

// ---- Conectar con UI ----
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("calcForm");
    const out = document.getElementById("outDate");
    const warn = document.getElementById("warn");
    const resultBox = document.getElementById("result");
    const btnClear = document.getElementById("btnClear");
    const btnSubmit = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        warn.style.display = "none";
        resultBox.style.display = "none";

        const pais = document.getElementById("country").value;
        const fechaStr = document.getElementById("purchaseDate").value;
        const dias = Number(document.getElementById("bizDays").value);

        if (!pais || !fechaStr || !dias) {
            warn.textContent = "⚠️ Completa todos los campos.";
            warn.style.display = "block";
            return;
        }

        // UX: Mostrar estado de carga mientras consulta la API
        btnSubmit.textContent = "Calculando...";
        btnSubmit.disabled = true;

        try {
            const fechaEntrega = await calcularEntrega(pais, fechaStr, dias);
            out.textContent = fechaEntrega.toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            });
            resultBox.style.display = "block";
        } catch (err) {
            warn.textContent = "❌ Ocurrió un error al calcular. Intenta nuevamente.";
            warn.style.display = "block";
        } finally {
            // Restaurar el botón
            btnSubmit.textContent = "Calcular entrega";
            btnSubmit.disabled = false;
        }
    });

    btnClear.addEventListener("click", () => {
        form.reset();
        out.textContent = "--/--/----";
        warn.style.display = "none";
        resultBox.style.display = "none";
    });
});