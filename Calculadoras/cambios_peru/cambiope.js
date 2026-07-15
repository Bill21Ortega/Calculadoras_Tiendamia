document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 📌 CONSTANTES Y REGLAS DE NEGOCIO
    // ==========================================
    const TARIFA_PESO_USD = 21.99; // Tarifa por cada Kilo extra
    const PENALIDAD_12H_USD = 15.00; // Costo por gestión pasadas 12h
    const UMBRAL_IMPUESTOS = 200.00; // Límite en USD para cobro de impuestos
    const TASA_IMPUESTOS = 0.2272; // 22.72% (Arancel 4% + IGV 18% escalonado)

    // ==========================================
    // 📌 REFERENCIAS AL DOM
    // ==========================================
    const valorPagadoEl = document.getElementById('valorPagado');
    const nuevoValorEl = document.getElementById('nuevoValor');
    const pesoPagadoEl = document.getElementById('pesoPagado');
    const nuevoPesoEl = document.getElementById('nuevoPeso');
    const penalidad12hEl = document.getElementById('penalidad12h');
    
    const btnCalcular = document.getElementById('calcular');
    const btnLimpiar = document.getElementById('limpiar');
    
    const warnEl = document.getElementById('warn');
    const resultadoEl = document.getElementById('resultado');
    const emergenciaAPIEl = document.getElementById('emergenciaAPI');
    const tasaManualEl = document.getElementById('tasaManual');

    let tasaOficial = null; // Guardará la tasa de la API

    // ==========================================
    // 📌 FUNCIONES AUXILIARES
    // ==========================================

    // Redondeo a 2 decimales para dinero
    const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

    // Convertir input a número válido (Soporta punto y coma)
    const parseNumberInput = (text) => {
        if (!text) return null;
        const s = String(text).trim().replace(',', '.');
        const regex = /^-?\d+(\.\d+)?$/;
        return regex.test(s) ? parseFloat(s) : null;
    };

    // UX: Cambia "," por "." mientras el usuario escribe
    [valorPagadoEl, nuevoValorEl, pesoPagadoEl, nuevoPesoEl, tasaManualEl].forEach(inp => {
        inp.addEventListener('input', (e) => {
            const before = e.target.value;
            const after = before.replace(',', '.');
            if (before !== after) e.target.value = after;
        });
    });

    // ==========================================
    // 📌 CÁLCULO PRINCIPAL
    // ==========================================

    const procesarCalculo = (tasaCambio) => {
        // 1. Obtener y validar valores
        const valorPagadoPEN = parseNumberInput(valorPagadoEl.value);
        const nuevoValorPEN = parseNumberInput(nuevoValorEl.value);
        const pesoPagado = parseNumberInput(pesoPagadoEl.value);
        const nuevoPeso = parseNumberInput(nuevoPesoEl.value);

        if (valorPagadoPEN === null || nuevoValorPEN === null || pesoPagado === null || nuevoPeso === null) {
            warnEl.innerHTML = '⚠️ Por favor, ingresa números válidos en todos los campos.';
            warnEl.style.display = 'block';
            return;
        }

        // 2. Variables para desglosar la cuenta (Todo en USD para estandarizar)
        let totalCobroUSD = 0;
        let detalleHTML = '';

        // --- A. Diferencia de Precio del Producto ---
        const diferenciaPrecioPEN = nuevoValorPEN - valorPagadoPEN;
        const diferenciaPrecioUSD = diferenciaPrecioPEN / tasaCambio;
        totalCobroUSD += diferenciaPrecioUSD;

        detalleHTML += `<div class="detalle-calc">📦 <b>Dif. de Producto:</b> ${diferenciaPrecioUSD > 0 ? '+' : ''}${round2(diferenciaPrecioUSD)} USD</div>`;

        // --- B. Regla del Peso ---
        let costoPesoUSD = 0;
        if (nuevoPeso > pesoPagado) {
            const difPeso = nuevoPeso - pesoPagado;
            costoPesoUSD = difPeso * TARIFA_PESO_USD;
            detalleHTML += `<div class="detalle-calc">⚖️ <b>Peso Extra (${round2(difPeso)} kg):</b> +${round2(costoPesoUSD)} USD</div>`;
        } else {
            detalleHTML += `<div class="detalle-calc">⚖️ <b>Peso Extra:</b> $0.00 USD (A favor o igual)</div>`;
        }
        totalCobroUSD += costoPesoUSD;

        // --- C. Penalidad 12 Horas ---
        let costoGestionUSD = 0;
        if (penalidad12hEl.checked) {
            costoGestionUSD = PENALIDAD_12H_USD;
            detalleHTML += `<div class="detalle-calc">⏱️ <b>Costo Gestión (>12h):</b> +${round2(costoGestionUSD)} USD</div>`;
        }
        totalCobroUSD += costoGestionUSD;

        // --- D. Regla de Impuestos Aduaneros (22.72%) ---
        const valorPagadoUSD = valorPagadoPEN / tasaCambio;
        const nuevoValorUSD = nuevoValorPEN / tasaCambio;
        
        let impuestoUSD = 0;

        if (valorPagadoUSD < UMBRAL_IMPUESTOS && nuevoValorUSD >= UMBRAL_IMPUESTOS) {
            // Escenario 2: Cruza el umbral (Paga sobre el total del nuevo)
            impuestoUSD = nuevoValorUSD * TASA_IMPUESTOS;
            detalleHTML += `<div class="detalle-calc">🏛️ <b>Impuestos Aduana:</b> +${round2(impuestoUSD)} USD (El nuevo superó $200)</div>`;
        } else if (valorPagadoUSD >= UMBRAL_IMPUESTOS && nuevoValorUSD >= UMBRAL_IMPUESTOS) {
            // Escenario 3: Ambos superan (Paga solo sobre la diferencia positiva)
            if (nuevoValorUSD > valorPagadoUSD) {
                impuestoUSD = (nuevoValorUSD - valorPagadoUSD) * TASA_IMPUESTOS;
                detalleHTML += `<div class="detalle-calc">🏛️ <b>Impuestos Aduana:</b> +${round2(impuestoUSD)} USD (Solo por la dif.)</div>`;
            } else {
                detalleHTML += `<div class="detalle-calc">🏛️ <b>Impuestos Aduana:</b> $0.00 USD (Nuevo valor es menor)</div>`;
            }
        } else {
            // Escenario 1: Ninguno supera
            detalleHTML += `<div class="detalle-calc">🏛️ <b>Impuestos Aduana:</b> $0.00 USD (No superan $200)</div>`;
        }
        
        totalCobroUSD += impuestoUSD;

        // 3. Totales Finales
        const totalCobroPEN = totalCobroUSD * tasaCambio;

        // 4. Renderizar Resultado
        let msjFinal = `<div style="font-size: 13px; color: #555; margin-bottom: 10px;">📊 Tasa de cambio usada: 1 USD = ${round2(tasaCambio)} PEN</div>`;
        msjFinal += detalleHTML;

        if (totalCobroUSD > 0) {
            msjFinal += `
                <div class="pago-pen">🔴 TOTAL A COBRAR: ${round2(totalCobroPEN)} PEN</div>
                <div class="pago-usd">🟢 TOTAL A COBRAR: ${round2(totalCobroUSD)} USD</div>
            `;
        } else if (totalCobroUSD < 0) {
            msjFinal += `
                <div class="pago-usd" style="background-color: #e3f2fd; border-left-color: #1976d2; color: #1976d2;">
                    🔵 SALDO A FAVOR DEL CLIENTE: ${Math.abs(round2(totalCobroUSD))} USD
                </div>
            `;
        } else {
            msjFinal += `<div class="pago-usd" style="color: #333; background: #f0f0f0; border-left-color: #999;">⚖️ Cambio exacto, sin diferencias a cobrar.</div>`;
        }

        resultadoEl.innerHTML = msjFinal;
        resultadoEl.style.display = 'block';
    };

    // ==========================================
    // 📌 EVENTOS DE BOTONES
    // ==========================================

    btnCalcular.addEventListener('click', async () => {
        // Limpiar alertas previas
        warnEl.style.display = 'none';
        resultadoEl.style.display = 'none';

        // Si el plan de emergencia está activo y el agente metió la tasa manual, usar esa
        if (emergenciaAPIEl.style.display === 'block') {
            const tasaManual = parseNumberInput(tasaManualEl.value);
            if (!tasaManual || tasaManual <= 0) {
                warnEl.innerHTML = '⚠️ Ingresa una tasa manual válida para continuar.';
                warnEl.style.display = 'block';
                return;
            }
            procesarCalculo(tasaManual);
            return;
        }

        // Mostrar aviso de carga mientras busca la tasa
        resultadoEl.innerHTML = '⏳ Conectando con el servidor de divisas...';
        resultadoEl.style.display = 'block';

        try {
            // Consulta de Tasa de Cambio (Lado del cliente)
            const response = await fetch('https://open.er-api-ERROR.com/v6/latest/USD');
            const data = await response.json();
            
            if (data.result === "success") {
                tasaOficial = data.rates.PEN;
                procesarCalculo(tasaOficial);
            } else {
                throw new Error("Respuesta inválida de la API");
            }
        } catch (error) {
            // ¡PLAN DE EMERGENCIA ACTIVADO!
            resultadoEl.style.display = 'none';
            emergenciaAPIEl.style.display = 'block';
        }
    });

    btnLimpiar.addEventListener('click', () => {
        valorPagadoEl.value = '';
        nuevoValorEl.value = '';
        pesoPagadoEl.value = '';
        nuevoPesoEl.value = '';
        tasaManualEl.value = '';
        penalidad12hEl.checked = false;
        
        warnEl.style.display = 'none';
        resultadoEl.style.display = 'none';
        emergenciaAPIEl.style.display = 'none';
    });
});