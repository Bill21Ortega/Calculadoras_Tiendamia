document.addEventListener('DOMContentLoaded', () => {
    const CARGOS = {
        gestion: 1.79,
        feeAmz: 0.03,
        feeLocal: 5,
        reciprocidad: 0.10,
        arancelCat: 0.10,
        exportacionUY: 174
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

    const mostrarError = (elemento, mensaje) => {
        elemento.style.borderColor = 'red';
        let errorSpan = elemento.nextElementSibling;
        if (!errorSpan || !errorSpan.classList.contains('error-msg')) {
            errorSpan = document.createElement('span');
            errorSpan.classList.add('error-msg');
            errorSpan.style.color = 'red';
            errorSpan.style.fontSize = '11px';
            errorSpan.style.display = 'block';
            errorSpan.style.marginTop = '2px';
            elemento.parentNode.insertBefore(errorSpan, elemento.nextSibling);
        }
        errorSpan.textContent = mensaje;
    };

    const limpiarErrores = () => {
        document.querySelectorAll('.error-msg').forEach(el => el.remove());
        [paisEl, pesoEl, valorEl, categoriaEl].forEach(el => el.style.borderColor = '');
    };

    btnCalcular.addEventListener('click', (e) => {
        e.preventDefault(); // Evita recarga accidental
        limpiarErrores();
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
        if (!pais) { mostrarError(paisEl, "Selecciona una opción correcta"); tieneErrores = true; }
        if (isNaN(valor) || valor <= 0) { mostrarError(valorEl, "Ingresa un valor correcto"); tieneErrores = true; }
        if (isNaN(peso) || peso <= 0) { mostrarError(pesoEl, "Ingresa un valor correcto"); tieneErrores = true; }
        if (!categoria) { mostrarError(categoriaEl, "Selecciona una opción correcta"); tieneErrores = true; }

        if (tieneErrores) return;

        let costoEnvio = obtenerCostoEnvio(pais, peso);
        let seguro = 0;
        if (pais === 'argentina') seguro = 13.5;
        if (pais === 'uruguay') seguro = valor >= 400 ? valor * 0.01 : 4;

        let cargoExportUY = (pais === 'uruguay' && valor >= 200) ? CARGOS.exportacionUY : 0;
        const fAMZ = valor * CARGOS.feeAmz;
        const fRec = valor * CARGOS.reciprocidad;
        const fAra = valor * CARGOS.arancelCat;

        const costoTotal = costoEnvio + CARGOS.gestion + seguro + fAMZ + CARGOS.feeLocal + cargoExportUY + fRec + fAra;
        const reembolso = valor - costoTotal;

        const esRecomendable = reembolso >= (valor * 0.30);
        const colorClase = reembolso >= 0 ? 'text-positive' : 'text-negative';
        
        let avisoShip = (pais === 'ecuador' || pais === 'costa_rica') ? '<br><small style="color: #d9534f;">⚠️ Shipping a cargo del cliente</small>' : '';

        resultadoEl.innerHTML = `
            <div style="text-align: left; border-top: 1px solid #ddd; padding-top: 15px; margin-top: 15px;">
                <p style="margin: 5px 0;">Costo Devolución: <strong>${costoTotal.toFixed(1)} USD</strong> ${avisoShip}</p>
                <p style="margin: 5px 0;">Reembolso: <strong class="${colorClase}">${reembolso.toFixed(1)} USD</strong></p>
                <p style="margin: 5px 0;">Sugerencia: ${esRecomendable ? '<b style="color:green">✅ Recomendable</b>' : '<b style="color:red">❌ No recomendable</b>'}</p>
                
                <button id="toggleDesglose" type="button" style="background: none; border: none; color: #007bff; cursor: pointer; padding: 0; font-size: 13px; text-decoration: underline; margin-top: 10px;">
                    Ver desglose de cargos
                </button>
                
                <div id="desgloseDetalle" style="display: none; background: #f9f9f9; padding: 10px; border-radius: 5px; margin-top: 10px; font-size: 12px; border: 1px dashed #ccc;">
                    Flete: ${costoEnvio.toFixed(1)} USD<br>
                    Gestión: ${CARGOS.gestion} USD<br>
                    Seguro: ${seguro.toFixed(1)} USD<br>
                    Fee AMZ: ${fAMZ.toFixed(1)} USD<br>
                    Fee Local: ${CARGOS.feeLocal} USD<br>
                    ${cargoExportUY > 0 ? `Exportación: ${cargoExportUY} USD<br>` : ''}
                    Reciprocidad: ${fRec.toFixed(1)} USD<br>
                    Arancel: ${fAra.toFixed(1)} USD
                </div>
            </div>
        `;
        resultadoEl.style.display = 'block';

        // Lógica de alternancia (Persistente)
        document.getElementById('toggleDesglose').onclick = function(e) {
            e.preventDefault(); // Refuerzo para evitar el parpadeo
            const d = document.getElementById('desgloseDetalle');
            if (d.style.display === 'none') {
                d.style.display = 'block';
                this.textContent = 'Ocultar desglose';
            } else {
                d.style.display = 'none';
                this.textContent = 'Ver desglose de cargos';
            }
        };
    });

    btnLimpiar.addEventListener('click', () => {
        limpiarErrores();
        resultadoEl.style.display = 'none';
        pesoEl.value = '';
        valorEl.value = '';
        paisEl.selectedIndex = 0;
        categoriaEl.selectedIndex = 0;
    });
});