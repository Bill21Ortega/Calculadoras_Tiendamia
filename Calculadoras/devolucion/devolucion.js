document.addEventListener('DOMContentLoaded', () => {
    // 1. CONFIGURACIÓN DE CARGOS FIJOS Y PORCENTAJES
    const CARGOS = {
        gestion: 1.79, 
        feeAmz: 0.03, 
        feeLocal: 5,
        reciprocidad: 0.10, 
        arancelCat: 0.10, 
        exportacionUY: 174
    };

    // 2. FUNCIÓN DE FLETE (Búsqueda en Tabla Maestra Oficial)
    const obtenerCostoEnvio = (pais, peso) => {
        if (pais === 'ecuador' || pais === 'costa_rica') return 0;

        // Tabla extraída de tu documento (Peso Máximo del Rango vs Costo USD)
        const tablaMaestra = {
            'uruguay': [
                [0.5, 29.21], [1, 32.58], [1.5, 32.73], [2, 36.15], [2.5, 39.58], [3, 43.87], [3.5, 48.17], [4, 52.46], [4.5, 56.75], [5, 59.64],
                [5.5, 68.82], [6, 78.44], [6.5, 84.92], [7, 92.70], [7.5, 100.48], [8, 107.11], [8.5, 115.49], [9, 122.46], [9.5, 131.09], [10, 138.82],
                [11, 153.83], [12, 169.93], [13, 185.39], [14, 200.85], [15, 217.15], [16, 232.41], [17, 247.71], [18, 263.27], [19, 278.83], [20, 294.38],
                [21, 302.41], [22, 310.84], [23, 319.27], [24, 327.40], [25, 335.52], [26, 344.25], [27, 352.68], [28, 360.81], [29, 369.04], [30, 377.26],
                [40, 501.95], [50, 632.45], [60, 762.94], [70, 893.43]
            ],
            'argentina': [
                [0.5, 30.90], [1, 31.23], [1.5, 31.33], [2, 35.13], [2.5, 38.92], [3, 42.77], [3.5, 46.63], [4, 50.48], [4.5, 55.69], [5, 59.44],
                [5.5, 66.38], [6, 73.76], [6.5, 80.60], [7, 87.43], [7.5, 96.28], [8, 101.97], [8.5, 109.40], [9, 115.43], [9.5, 123.12], [10, 131.92],
                [11, 140.02], [12, 146.89], [13, 154.27], [14, 161.66], [15, 171.91], [16, 179.09], [17, 186.33], [18, 193.81], [19, 201.29], [20, 210.80],
                [21, 217.88], [22, 225.37], [23, 232.85], [24, 240.03], [25, 249.24], [26, 257.02], [27, 264.50], [28, 271.69], [29, 278.97], [30, 288.28],
                [40, 297.19], [50, 311.89], [60, 326.60], [70, 341.01]
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

        // Buscamos el primer rango que cubra el peso ingresado
        for (const [maxPeso, costo] of paisData) {
            if (peso <= maxPeso) return costo;
        }

        // Si excede 70kg, tomamos el último valor disponible de la tabla
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

    // 5. LÓGICA PRINCIPAL DE CÁLCULO
    btnCalcular.addEventListener('click', (e) => {
        e.preventDefault();
        resultadoEl.style.display = 'none';
        limpiarErrores();

        // Normalizamos el input (cambia la coma por punto para evitar errores tipográficos)
        const normalizarInput = (inputEl) => {
            let valorTexto = inputEl.value.trim().replace(',', '.');
            return parseFloat(valorTexto);
        };

        const pais = paisEl.value;
        const valor = normalizarInput(valorEl);
        const peso = normalizarInput(pesoEl);
        const categoria = categoriaEl.value;

        // Validaciones iniciales
        let tieneErrores = false;
        if (!pais) { aplicarError(paisEl, "Requerido"); tieneErrores = true; }
        if (isNaN(valor) || valor <= 0) { aplicarError(valorEl, "Inválido"); tieneErrores = true; }
        if (isNaN(peso) || peso <= 0) { aplicarError(pesoEl, "Inválido"); tieneErrores = true; }
        if (!categoria) { aplicarError(categoriaEl, "Requerido"); tieneErrores = true; }
        if (tieneErrores) return;

        // Regla de Negocio: Monto Mínimo de $65 USD
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

        // 1. SUBTOTAL REAL (Se usa para calcular el reembolso sin recargos extra)
        let subtotalBreakdown = flete + cargosFijos + fAMZ + fRec + fAra;

        // 2. COSTO FINAL MOSTRADO (Con recargo del 25% solo para Argentina y Uruguay)
        let multiplicadorFinal = (pais === 'argentina' || pais === 'uruguay') ? 1.25 : 1.0;
        let costoTotalMostrado = subtotalBreakdown * multiplicadorFinal;

        // 3. REEMBOLSO (Calculado a partir del subtotal real)
        let reembolsoFinal = valor - subtotalBreakdown;

        // Recomendación visual (30% de rentabilidad)
        const esRecomendable = reembolsoFinal >= (valor * 0.30);
        const colorClase = reembolsoFinal >= 0 ? 'text-positive' : 'text-negative';
        let avisoShip = (pais === 'ecuador' || pais === 'costa_rica') ? 
            '<small style="color:#d9534f; display:block; font-size:11px; margin-top:2px;">⚠️ Envío cargo cliente</small>' : '';

        // RENDERIZADO EN PANTALLA
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
                    Flete: ${flete.toFixed(2)}<br>
                    Gestión: ${CARGOS.gestion}<br>
                    Seguro: ${seguro.toFixed(2)}<br>
                    Fee AMZ: ${fAMZ.toFixed(2)}<br>
                    Fee Local: ${CARGOS.feeLocal}<br>
                    Recip: ${fRec.toFixed(2)}<br>
                    Aranc: ${fAra.toFixed(2)}<br>
                    ${cargoExportUY > 0 ? `Export: ${cargoExportUY}` : ''}
                </div>
            </div>
        `;
        resultadoEl.style.display = 'block';

        // Lógica del botón Detalles
        document.getElementById('toggleDesglose').onclick = function(e) {
            e.preventDefault();
            const d = document.getElementById('desgloseDetalle');
            d.style.display = d.style.display === 'none' ? 'block' : 'none';
            this.textContent = d.style.display === 'none' ? 'Detalles' : 'Ocultar';
        };
    });

    // Lógica del botón Limpiar
    btnLimpiar.addEventListener('click', () => {
        limpiarErrores();
        resultadoEl.style.display = 'none';
        pesoEl.value = ''; valorEl.value = '';
        paisEl.selectedIndex = 0; categoriaEl.selectedIndex = 0;
    });
});