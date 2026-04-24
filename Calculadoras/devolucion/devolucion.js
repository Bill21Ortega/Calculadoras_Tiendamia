document.addEventListener('DOMContentLoaded', () => {
    const CARGOS = {
        gestion: 1.79, feeAmz: 0.03, feeLocal: 5,
        reciprocidad: 0.10, arancelCat: 0.10, exportacionUY: 174
    };

    const obtenerCostoEnvio = (pais, peso) => {
        if (pais === 'ecuador' || pais === 'costa_rica') return 0;
        if (pais === 'argentina') {
            if (peso <= 0.5) return 31.23;
            if (peso <= 2.0) return 38.92;
            if (peso <= 5.0) return 66.38;
            return 131.92;
        }
        if (pais === 'peru') {
            if (peso <= 0.5) return 25.44;
            if (peso <= 2.0) return 29.23;
            if (peso <= 10.0) return 124.16;
            return 124.16;
        }
        if (pais === 'uruguay') {
            if (peso <= 0.8) return 32.58;
            if (peso <= 1.0) return 32.73;
            if (peso <= 1.5) return 36.15;
            if (peso <= 9.5) return 131.09;
            return 138.82;
        }
        return 0;
    };

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

    btnCalcular.addEventListener('click', (e) => {
        e.preventDefault();
        resultadoEl.style.display = 'none';

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

        let costoEnvio = obtenerCostoEnvio(pais, peso);
        let seguro = (pais === 'argentina') ? 13.5 : (pais === 'uruguay' ? (valor >= 400 ? valor * 0.01 : 4) : 0);
        let cargoExportUY = (pais === 'uruguay' && valor >= 200) ? CARGOS.exportacionUY : 0;
        
        const fAMZ = valor * CARGOS.feeAmz;
        const fRec = valor * CARGOS.reciprocidad;
        const fAra = valor * CARGOS.arancelCat;

        const costoTotal = costoEnvio + CARGOS.gestion + seguro + fAMZ + CARGOS.feeLocal + cargoExportUY + fRec + fAra;
        const reembolso = valor - costoTotal;

        const esRecomendable = reembolso >= (valor * 0.30);
        const colorClase = reembolso >= 0 ? 'text-positive' : 'text-negative';
        
        let avisoShip = (pais === 'ecuador' || pais === 'costa_rica') ? 
            '<small style="color:#d9534f; display:block; font-size:11px; margin-top:2px;">⚠️ Envío cargo cliente</small>' : '';

        resultadoEl.innerHTML = `
            <div style="border-top:1px solid #ddd; margin-top:8px; padding-top:8px; font-size:13px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                    <span>Costo: <b>${costoTotal.toFixed(1)} USD</b></span>
                    <span>Reembolso: <b class="${colorClase}">${reembolso.toFixed(1)} USD</b></span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                    <span>Sugerencia: ${esRecomendable ? '<b style="color:green">✅ Recomendable</b>' : '<b style="color:red">❌ No</b>'}</span>
                    <button id="toggleDesglose" type="button" style="background:none; border:none; color:#007bff; cursor:pointer; font-size:11px; text-decoration:underline; padding:0;">Detalles</button>
                </div>
                ${avisoShip}
                <div id="desgloseDetalle" style="display:none; background:#f4f4f4; padding:6px; border-radius:4px; margin-top:5px; font-size:10px; border:1px dashed #ccc; column-count: 2; line-height:1.2;">
                    Flete: ${costoEnvio.toFixed(1)}<br>
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