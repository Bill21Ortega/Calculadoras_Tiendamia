/* =====================================================
   scripts/main.js
   Control de pestañas y carga del iframe (index madre)
   ===================================================== */

/* BLOQUE: Inicialización y referencias DOM */
const tabs = Array.from(document.querySelectorAll(".tab"));
const frame = document.getElementById("calcFrame");

/* BLOQUE: Función para activar una pestaña por elemento (btn) */
function activateTab(tabBtn) {
  // limpia todas
  tabs.forEach(t => {
    t.classList.remove("active");
    t.setAttribute("aria-selected", "false");
  });

  // activa la seleccionada
  tabBtn.classList.add("active");
  tabBtn.setAttribute("aria-selected", "true");

  // cambiar src del iframe
  const src = tabBtn.getAttribute("data-src");
  if (src) {
    frame.src = src;
  }

  // guardar elección para restaurar en recarga
  try { localStorage.setItem("calc-active-src", src); } catch(e) {}
}

/* BLOQUE: Añadir listeners a las tabs (click y teclado) */
tabs.forEach(tab => {
  // click
  tab.addEventListener("click", () => {
    if (tab.classList.contains("disabled")) return;
    activateTab(tab);
  });

  // keyboard navigation (Left / Right)
  tab.addEventListener("keydown", (ev) => {
    if (ev.key === "ArrowRight" || ev.key === "ArrowLeft") {
      ev.preventDefault();
      const idx = tabs.indexOf(tab);
      const dir = ev.key === "ArrowRight" ? 1 : -1;
      let next = (idx + dir + tabs.length) % tabs.length;
      // busca siguiente que no esté disabled
      while (tabs[next].classList.contains("disabled")) {
        next = (next + dir + tabs.length) % tabs.length;
      }
      tabs[next].focus();
    }
  });
});

/* BLOQUE: Restaurar pestaña seleccionada en localStorage (si existe) */
(function restoreLast() {
  try {
    const last = localStorage.getItem("calc-active-src");
    if (last) {
      const btn = tabs.find(t => t.getAttribute("data-src") === last);
      if (btn) { activateTab(btn); return; }
    }
  } catch(e) { /* no hacer nada */ }
  // si no hay, dejamos la primera tab activa (ya definida en HTML)
})();

/* BLOQUE: Ajustar alto del iframe al contenido (intento, si misma origin) */
frame.addEventListener("load", () => {
  try {
    // dar tiempo a que el contenido pinte
    setTimeout(() => {
      const doc = frame.contentDocument || frame.contentWindow.document;
      if (!doc) return;
      // calcular altura del documento
      const h = Math.max(
        doc.documentElement.scrollHeight,
        doc.body.scrollHeight,
        doc.documentElement.offsetHeight
      );
      // limitar mínimo y máximo si quieres (aquí directo)
      frame.style.height = (h + 40) + "px";
    }, 120);
  } catch (err) {
    // si hay error (por seguridad o configuración), dejamos el tamaño por defecto
    console.warn("No se pudo autoajustar el iframe:", err);
  }
});
// -----------------------------
// Ajuste dinámico de altura del iframe
// -----------------------------
(function () {
  const iframe = document.getElementById('calcFrame');
  const header = document.querySelector('.site-header');
  const tabs = document.querySelector('.tabs');

  function getPx(el) {
    return el ? Math.ceil(el.getBoundingClientRect().height) : 0;
  }

  function adjustIframeHeight() {
    // espacio extra para evitar que quede justo al borde (ajusta si quieres)
    const extra = 12;
    const hWindow = window.innerHeight;
    const hHeader = getPx(header);
    const hTabs = getPx(tabs);
    const target = Math.max(420, hWindow - hHeader - hTabs - extra);
    if (iframe) iframe.style.height = target + 'px';
  }

  // Llamadas iniciales y listeners
  window.addEventListener('load', adjustIframeHeight);
  window.addEventListener('resize', adjustIframeHeight);

  // Si tienes la lógica de pestañas que cambia src, cada vez que cambies pestaña llama a adjustIframeHeight()
  // También re-ajustar cuando el iframe termine de cargar su documento
  if (iframe) {
    iframe.addEventListener('load', () => {
      // un pequeño timeout deja que el contenido interno se estabilice
      setTimeout(adjustIframeHeight, 80);
    });
  }

  // Si tu main.js controla los clicks en las .tab, asegúrate de llamar adjustIframeHeight() tras cambiar src.
  // Si no, añadimos un listener general a los botones .tab
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      // dar tiempo a que la src cambie y cargue
      setTimeout(adjustIframeHeight, 120);
    });
  });
})();
