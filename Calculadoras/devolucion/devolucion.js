document.addEventListener('DOMContentLoaded', () => {
    // 1. CONFIGURACIÓN DE CARGOS FIJOS Y PORCENTAJES
    const CARGOS = {
        gestion: 1.79, 
        feeAmz: 0.03, 
        feeLocal: 5,
        reciprocidad: 0.10, 
        arancelCat: 0.10 // 10% fijo para todas las categorías
    };

    // 2. FUNCIÓN DE FLETE (Tabla completa hasta 70kg)
    const obtenerCostoEnvio = (pais, pesoReal) => {
        if (pais === 'ecuador' || pais === 'costa_rica') return 0;

        let pesoBuscar = pesoReal + 0.001; 

        const tablaMaestra = {
            'uruguay': [
                [0.5, 29.21], [1, 32.58], [1.5, 32.73], [2, 36.15], [2.5, 39.58], [3, 43.87], [3.5, 48.17], [4, 52.46], [4.5, 56.75], [5, 59.64],
                [5.5, 68.82], [6, 78.44], [6.5, 84.92], [7, 92.70], [7.5, 100.48], [8, 107.11], [8.5, 115.49], [9, 122.46], [9.5, 131.09], [10, 138.82],
                [11, 153.83], [12, 169.93], [13, 185.39], [14, 200.85], [15, 217.15], [16, 232.41], [17, 247.71], [18, 263.27], [19, 278.83], [20, 294.38],
                [21, 302.41], [22, 310.84], [23, 319.27], [24, 327.40], [25, 335.52], [26, 344.25], [27, 352.68], [28, 360.81], [29, 369.04], [30, 377.26],
                [40, 501.95], [50, 632.45], [60, 762.94], [70, 893.43]
            ],
            'argentina': [
                [0.5, 30.45], [1, 30.45], [1.5, 30.45], [2, 34.12], [2.5, 37.78], [3, 41.44], [3.5, 45.46], [4, 49.48], [4.5, 53.50], [5, 57.52],
                [5.5, 64.47], [6, 71.42], [6.5, 78.37], [7, 85.32], [7.5, 92.27], [8, 99.22], [8.5, 106.17], [9, 113.12], [9.5, 120.07], [10, 127.02],
                [11, 140.92], [12, 154.82], [13, 168.72], [14, 182.62], [15, 196.52], [16, 210.42], [17, 224.32], [18, 238.22], [19, 252.12], [20, 266.02],
                [21, 279.92], [22, 293.82], [23, 307.72], [24, 321.62], [25, 335.52], [26, 349.42], [27, 363.32], [28, 377.22], [29, 391.12], [30, 405.02],
                [40, 544.02], [50, 683.02], [60, 822.02], [70, 961.02]
            ],
            'peru': [
                [0.5, 25.34], [1, 25.44], [1.5, 25.54], [2, 25.64], [2.5, 29.23], [3, 32.84], [3.5, 36.45], [4, 40.06], [4.5, 43.67], [5, 47.28],
                [5.5, 53.69], [6, 60.09], [6.5, 66.50], [7, 72.91], [7.5, 79.31], [8, 85.72], [8.5, 92.13], [9, 98.54], [9.5, 104.94], [10, 111.35],
                [11, 124.16], [12, 136.98], [13, 149.79], [14, 162.61], [15, 175.42], [16, 188.23], [17, 201.05], [18, 213.86], [19, 226.68], [20, 239.49],
                [21, 246.00], [22, 252.50], [23, 259.01], [24, 265.52], [25, 272.02], [26, 278.53], [27, 285.04], [28, 291.55], [29, 298.05], [30, 304.56],
                [40, 425.02], [50, 551.28], [60, 677.54], [70, 803.80]
            ]
        };

        const paisData = tablaMaestra[pais];
        if (!paisData) return 0;

        for (const [maxPeso, costo] of paisData) {
            if (pesoBuscar <= maxPeso) return costo;
        }

        return paisData[paisData.length - 1][1];
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

    // 4. FUNCIONES DE INTERFAZ Y MANEJO DE ERRORES
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

    const mostrarAlertaRoja = (mensaje) => {
        resultadoEl.innerHTML = `<div style="border:1px solid red; background:#fff5f5; padding:6px; border-radius:4px; margin-top:6px; color:red; font-size:12px; text-align:center;">⚠️ <b>No permitida:</b> ${mensaje}</div>`;
        resultadoEl.style.display = 'block';
    };

    // 5. LÓGICA PRINCIPAL DE CÁLCULO
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

        if (valor < 65) return mostrarAlertaRoja("Valor menor a 65 USD.");
        if (peso > 70) return mostrarAlertaRoja("El peso excede el límite máximo de 70 kgs.");

        // --- EXTRACCIÓN DE COSTOS ACTUALIZADA ---
        let flete = obtenerCostoEnvio(pais, peso);
        let costoTotalMostrado = 0;
        let htmlDesglose = '';

        if (valor > 200) {
            // Regla para órdenes > 200 USD: Costo fijo de $205 + flete por peso
            costoTotalMostrado = flete + 205;
            htmlDesglose = `
                Flete: ${flete.toFixed(2)}<br>
                Costo Fijo (>200 USD): 205.00<br>
            `;
        } else {
            // Regla estándar para órdenes <= 200 USD
            let seguro = (pais === 'argentina') ? 13.5 : (pais === 'uruguay' ? (valor >= 400 ? valor * 0.01 : 4) : 0);
            let fAMZ = valor * CARGOS.feeAmz;
            let fRec = valor * CARGOS.reciprocidad;
            let fAra = valor * CARGOS.arancelCat;
            let cargosFijos = CARGOS.gestion + seguro + CARGOS.feeLocal;

            costoTotalMostrado = flete + cargosFijos + fAMZ + fRec + fAra;
            htmlDesglose = `
                Flete: ${flete.toFixed(2)}<br>
                Gestión: ${CARGOS.gestion}<br>
                Seguro: ${seguro.toFixed(2)}<br>
                AMZ: ${fAMZ.toFixed(2)}<br>
                Local: ${CARGOS.feeLocal}<br>
                Recip: ${fRec.toFixed(2)}<br>
                Aranc: ${fAra.toFixed(2)}<br>
            `;
        }

        let reembolsoFinal = valor - costoTotalMostrado;

        const esRecomendable = reembolsoFinal >= (valor * 0.30);
        const colorClase = reembolsoFinal >= 0 ? 'text-positive' : 'text-negative';
        let avisoShip = (pais === 'ecuador' || pais === 'costa_rica') ? 
            '<small style="color:#d9534f; display:block; font-size:11px; margin-top:2px;">⚠️ Envío cargo cliente</small>' : '';

        // UI COMPACTA
        resultadoEl.innerHTML = `
            <div style="border-top:1px solid #ddd; margin-top:6px; padding-top:6px; font-size:13px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                    <span>Costo: <b>${costoTotalMostrado.toFixed(1)} USD</b></span>
                    <span>Reembolso: <b class="${colorClase}">${reembolsoFinal.toFixed(1)} USD</b></span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>Sugerencia: ${esRecomendable ? '<b style="color:green">✅ Recomendable</b>' : '<b style="color:red">❌ No</b>'}</span>
                    <button id="toggleDesglose" type="button" style="background:none; border:none; color:#007bff; cursor:pointer; font-size:11px; text-decoration:underline; padding:0;">Ver Detalles</button>
                </div>
                ${avisoShip}
                <div id="desgloseDetalle" style="display:none; background:#f4f4f4; padding:6px; border-radius:4px; margin-top:4px; font-size:10px; border:1px dashed #ccc; column-count: 2; line-height:1.3;">
                    ${htmlDesglose}
                </div>
            </div>
        `;
        resultadoEl.style.display = 'block';

        document.getElementById('toggleDesglose').onclick = function(e) {
            e.preventDefault();
            const d = document.getElementById('desgloseDetalle');
            d.style.display = d.style.display === 'none' ? 'block' : 'none';
            this.textContent = d.style.display === 'none' ? 'Ocultar' : 'Ver Detalles';
        };
    });

    btnLimpiar.addEventListener('click', () => {
        limpiarErrores();
        resultadoEl.style.display = 'none';
        pesoEl.value = ''; valorEl.value = '';
        paisEl.selectedIndex = 0; categoriaEl.selectedIndex = 0;
    });
});