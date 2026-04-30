document.addEventListener('DOMContentLoaded', () => {
    // 1. CARGOS CONSTANTES GLOBALES
    const CARGOS = {
        gestion: 1.79, 
        feeAmz: 0.03, 
        feeLocal: 5,
        reciprocidad: 0.10, 
        arancelCat: 0.10, 
        exportacionUY: 174
    };

    // 2. FUNCIÓN DE FLETE (Tarifas planas basadas en el Excel)
    const obtenerCostoEnvio = (pais, peso) => {
        let pesoRedondeado = Math.ceil(peso); // Redondeo hacia arriba (ej. 1.2kg -> 2kg)
        
        if (pais === 'ecuador' || pais === 'costa_rica') return 0;
        
        if (pais === 'argentina') {
            if (pesoRedondeado <= 1) return 35.13;
            if (pesoRedondeado === 2) return 46.63;
            if (pesoRedondeado === 3) return 55.69;
            return 55.69 + ((pesoRedondeado - 3) * 10); // Estimación para mayores a 3kg
        }
        
        if (pais === 'uruguay') {
            if (pesoRedondeado <= 1) return 36.15;
            if (pesoRedondeado === 2) return 48.17;
            if (pesoRedondeado === 3) return 56.75;
            return 56.75 + ((pesoRedondeado - 3) * 10); // Estimación para mayores a 3kg
        }

        if (pais === 'peru') {
            if (peso <= 0.5) return 25.44;
            if (peso <= 2.0) return 29.23;
            return 124.16;
        }

        return 0;
    };

    // 3. REFERENCIAS AL DOM
    const paisEl = document.getElementById('paisOrigen');
    const pesoEl = document.getElementById('pesoKgs');
    const valorEl = document.getElementById('valorProducto');
    const categoriaEl = document.getElementById('categoria');
    const btnCalcular = document.getElementById('calcularDev');
    const btnLimpiar = document.getElementById('limpiarDev');
    const resultadoEl = document.getElementById('resultadoDev');

    const placeholdersOriginales = {
        pesoKgs: pesoEl.placeholder || "0.00",
        valorProducto: valorEl.placeholder || "0.00"
    };

    const aplicarError = (elemento, mensaje) => {
        elemento.style.borderColor = 'red';
        if (elemento.tagName === 'SELECT') {
            elemento.options[0].text = "⚠️ " + mensaje;
        } else {
            elemento.value = '';
            elemento.placeholder = "⚠️ " + mensaje;
        }
    };

    const limpiarErrores = () => {
        [paisEl, pesoEl, valorEl, categoriaEl].forEach(el => {
            el.style.borderColor = '';
            if (el.tagName === 'SELECT') {
                if(el.id === 'paisOrigen') el.options[0].text = "País";
                if(el.id === 'categoria') el.options[0].text = "Categoría";
            } else {
                el.placeholder = placeholdersOriginales[el.id];
            }
        });
    };

    [paisEl, pesoEl, valorEl, categoriaEl].forEach(el => {
        el.addEventListener('focus', () => {
            el.style.borderColor = '';
            if (el.tagName !== 'SELECT') el.placeholder = placeholdersOriginales[el.id];
        });
    });

    // 4. LÓGICA PRINCIPAL (La magia idéntica al Excel)
    btnCalcular.addEventListener('click', (e) => {
        e.preventDefault();
        resultadoEl.style.display = 'none';
        limpiarErrores();

        const normalizarInput = (inputEl) => {
            let valorTexto = inputEl.value.trim().replace(',', '.');
            return parseFloat(valorTexto);
        };

        const pais = paisEl.value;
        const valor = normalizarInput(valorEl);
        const peso = normalizarInput(pesoEl);
        const categoria = categoriaEl.value;

        let tieneErrores = false;
        if (!pais) { aplicarError(paisEl, "Requerido"); tieneErrores = true; }
        if (isNaN(valor) || valor <= 0) { aplicarError(valorEl, "Inválido"); tieneErrores = true; }
        if (isNaN(peso) || peso <= 0) { aplicarError(pesoEl, "Inválido"); tieneErrores = true; }
        if (!categoria) { aplicarError(categoriaEl, "Requerido"); tieneErrores = true; }
        if (tieneErrores) return;

        // Regla de $65 USD
        if (valor < 65) {
            resultadoEl.innerHTML = `<div style="border:1px solid red; background:#fff5f5; padding:8px; border-radius:4px; margin-top:8px; color:red; font-size:12px; text-align:center;">⚠️ <b>No permitida:</b> Valor menor a $65 USD.</div>`;
            resultadoEl.style.display = 'block';
            return;
        }

        // --- EXTRACCIÓN DE COSTOS ---
        let flete = obtenerCostoEnvio(pais, peso);
        let seguro = (pais === 'argentina') ? 13.5 : (pais === 'uruguay' ? (valor >= 400 ? valor * 0.01 : 4) : 0);
        let cargoExportUY = (pais === 'uruguay' && valor >= 200) ? CARGOS.exportacionUY : 0;
        
        let fAMZ = valor * CARGOS.feeAmz;
        let fRec = valor * CARGOS.reciprocidad;
        let fAra = valor * CARGOS.arancelCat;
        let cargosFijos = CARGOS.gestion + seguro + CARGOS.feeLocal + cargoExportUY;

        // 1. SUBTOTAL REAL (Para sacar el reembolso, igual que el Excel)
        let subtotalBreakdown = flete + cargosFijos + fAMZ + fRec + fAra;

        // 2. COSTO FINAL MOSTRADO (Con recargo del 25% para Arg y UY)
        let multiplicadorFinal = (pais === 'argentina' || pais === 'uruguay') ? 1.25 : 1.0;
        let costoTotalMostrado = subtotalBreakdown * multiplicadorFinal;

        // 3. REEMBOLSO (Se descuenta usando el subtotal SIN recargo)
        let reembolsoFinal = valor - subtotalBreakdown;

        const esRecomendable = reembolsoFinal >= (valor * 0.30);
        const colorClase = reembolsoFinal >= 0 ? 'text-positive' : 'text-negative';
        let avisoShip = (pais === 'ecuador' || pais === 'costa_rica') ? 
            '<small style="color:#d9534f; display:block; font-size:11px; margin-top:2px;">⚠️ Envío cargo cliente</small>' : '';

        // RENDERIZADO
        resultadoEl.innerHTML = `
            <div style="border-top:1px solid #ddd; margin-top:10px; padding-top:10px; font-size:14px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>Costo: <b>${costoTotalMostrado.toFixed(1)} USD</b></span>
                    <span>Reembolso: <b class="${colorClase}">${reembolsoFinal.toFixed(1)} USD</b></span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>Sugerencia: ${esRecomendable ? '<b style="color:green">✅ Recomendable</b>' : '<b style="color:red">❌ No</b>'}</span>
                    <button id="toggleDesglose" type="button" style="background:none; border:none; color:#007bff; cursor:pointer; font-size:12px; text-decoration:underline;">Detalles</button>
                </div>
                ${avisoShip}
                <div id="desgloseDetalle" style="display:none; background:#f4f4f4; padding:8px; border-radius:4px; margin-top:8px; font-size:11px; border:1px dashed #ccc; column-count: 2; line-height:1.4;">
                    Flete: ${flete.toFixed(1)}<br>
                    Gestión: ${CARGOS.gestion}<br>
                    Seguro: ${seguro.toFixed(1)}<br>
                    Fee AMZ: ${fAMZ.toFixed(1)}<br>
                    Fee Local: ${CARGOS.feeLocal}<br>
                    Recip: ${fRec.toFixed(1)}<br>
                    Aranc: ${fAra.toFixed(1)}<br>
                    ${cargoExportUY > 0 ? `Export: ${cargoExportUY}` : ''}
                </div>
            </div>
        `;
        resultadoEl.style.display = 'block';

        document.getElementById('toggleDesglose').onclick = function(e) {
            e.preventDefault();
            const d = document.getElementById('desgloseDetalle');
            d.style.display = d.style.display === 'none' ? 'block' : 'none';
            this.textContent = d.style.display === 'none' ? 'Detalles' : 'Ocultar';
        };
    });

    btnLimpiar.addEventListener('click', () => {
        limpiarErrores();
        resultadoEl.style.display = 'none';
        pesoEl.value = ''; valorEl.value = '';
        paisEl.selectedIndex = 0; categoriaEl.selectedIndex = 0;
    });
});