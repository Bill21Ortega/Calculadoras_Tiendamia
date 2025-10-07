 // ---- Utilidades ----
    function pad(n){ return String(n).padStart(2,'0'); }
    function toISODate(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
    function fromInputDate(v){
      if(!v) return null;
      const [y,m,d] = v.split('-').map(Number);
      return new Date(y, m-1, d, 12, 0, 0); // siempre al mediodía local
    }

    // ---- Cargar feriados ----
    let feriadosData = {};
    async function cargarFeriados() {
      try {
        const res = await fetch("./feriados.json", { cache: "no-store" });
        if (!res.ok) throw new Error("No se pudo cargar feriados.json");
        feriadosData = await res.json();
      } catch (err) {
        console.error("❌ Error cargando feriados:", err);
        feriadosData = {};
      }
    }

    // ---- Cálculo de entrega ----
    function calcularEntrega(pais, fechaCompra, diasHabiles) {
      if (!fechaCompra) throw new Error("Fecha de compra inválida");
      if (!diasHabiles || diasHabiles <= 0) throw new Error("Días hábiles inválidos");

      const paisNorm = pais.toUpperCase();
      const fecha = fromInputDate(fechaCompra); // ✅ ahora siempre usamos la función segura
      let restantes = diasHabiles;

      // Preparar lista de feriados
      const anio = fecha.getFullYear();
      const lista = (feriadosData[paisNorm] && feriadosData[paisNorm][anio]) || [];
      const feriados = new Set(lista.map(d => d));

      // 🚀 Iniciar desde el día siguiente
      fecha.setDate(fecha.getDate() + 1);

      while (restantes > 0) {
        const iso = toISODate(fecha);
        const dow = fecha.getDay(); // 0=domingo, 6=sábado
        const isWeekend = (dow === 0 || dow === 6);
        const isHoliday = feriados.has(iso);

        if (!isWeekend && !isHoliday) {
          restantes--;
        }

        if (restantes > 0) {
          fecha.setDate(fecha.getDate() + 1);
        }
      }

      return fecha;
    }

    // ---- Conectar con UI ----
    document.addEventListener("DOMContentLoaded", async () => {
      await cargarFeriados();

      const form = document.getElementById("calcForm");
      const out = document.getElementById("outDate");
      const warn = document.getElementById("warn");
      const resultBox = document.getElementById("result");
      const btnClear = document.getElementById("btnClear");

      form.addEventListener("submit", (ev) => {
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

        try {
          const fechaEntrega = calcularEntrega(pais, fechaStr, dias);
          out.textContent = fechaEntrega.toLocaleDateString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
          });
          resultBox.style.display = "block";
        } catch (err) {
          warn.textContent = "❌ Error: " + err.message;
          warn.style.display = "block";
        }
      });

      btnClear.addEventListener("click", () => {
        form.reset();
        out.textContent = "--/--/----";
        warn.style.display = "none";
        resultBox.style.display = "none";
      });
    });