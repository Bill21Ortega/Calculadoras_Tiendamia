#  Calculadoras Tiendamia

Este proyecto reúne un conjunto de **calculadoras web interactivas** diseñadas para el equipo de Tiendamia, con el objetivo de facilitar el cálculo de fechas de entrega y diferencias de peso en los envíos internacionales.  
Cada herramienta fue desarrollada en **HTML, CSS y JavaScript puro**, priorizando la simplicidad, portabilidad y compatibilidad en distintos navegadores y dispositivos.


## Objetivo del Proyecto

El propósito de estas calculadoras es **automatizar procesos internos del área de atención al cliente** y logística de Tiendamia, eliminando errores manuales y reduciendo tiempos de respuesta en reclamos o consultas.

Cada calculadora está optimizada para:
- Funcionar dentro de un `iframe` embebido en la web principal.
- Ajustarse automáticamente al tamaño de pantalla del usuario (diseño responsive).
- Mantener un estilo visual coherente con la identidad de Tiendamia.

---

## Calculadoras Incluidas

### 1. Calculadora de Fecha de Entrega
Permite calcular la fecha estimada de entrega de una orden considerando:
- Fecha de compra o despacho.
- País de destino.
- Feriados locales (cargados desde el archivo `feriados.json`).

#### **Cómo funciona**
1. El usuario selecciona la fecha base y el país.
2. El script (`fecha.js`) obtiene la lista de feriados del país desde `feriados.json`.
3. Se calculan los días hábiles sumando los plazos definidos según el destino.
4. El resultado se muestra directamente en pantalla con mensajes de éxito o advertencia.

#### **Archivos clave**
- `fecha.css`: define la estructura visual y estilos del módulo.
- `fecha.js`: contiene la lógica de cálculo.
- `feriados.json`: almacena los feriados nacionales por país.

---

### 2. Calculadora de Peso
Esta herramienta permite comparar el **peso real vs el peso pagado** de un envío, aplicando las reglas de cobro específicas de Tiendamia según país y modalidad de envío.

#### **Cómo funciona**
1. El usuario ingresa los datos del peso pagado y el peso real.
2. El script (`peso.js`) ejecuta las fórmulas de diferencia.
3. Se muestra un mensaje con el resultado y el importe adicional si aplica.

#### **Archivos clave**
- `peso.css`: estilos visuales, centrado de elementos y diseño adaptativo.
- `peso.js`: lógica del cálculo y renderizado dinámico de resultados.

---

## Tecnologías Utilizadas

| Tecnología | Uso principal |
|-------------|----------------|
| **HTML5** | Estructura semántica de cada calculadora |
| **CSS3 (Flexbox, Grid)** | Maquetación, diseño responsive y coherencia visual |
| **JavaScript (Vanilla)** | Lógica funcional, validaciones y cálculos |
| **JSON** | Configuración dinámica de feriados por país |
| **Git/GitHub** | Control de versiones y despliegue |

---

##  Diseño y Responsividad

- Ambas calculadoras se renderizan dentro de un `iframe` con altura máxima controlada (`90vh`), evitando scrolls innecesarios.
- El diseño está centrado vertical y horizontalmente en viewport, con un enfoque **mobile-first**.
- El color principal del branding es `#e30613`, característico de Tiendamia.
- Se eliminaron márgenes y recuadros excedentes para lograr una visualización limpia.

---

##  Decisiones de Diseño

- Se evitó el uso de frameworks o librerías externas (como Bootstrap o React) para mantener un **peso ligero y carga inmediata**.
- Se normalizó el estilo global (`main.css`) para todas las calculadoras, asegurando uniformidad visual.
- Se corrigieron issues de desbordamiento (`scroll fantasma`) mediante:
  ```css
  html, body {
    overflow-y: hidden;
    height: 100vh;
  }
Los logos (TiendamiaLogo.png y logo-™-white.webp) fueron posicionados de forma absoluta para mantener consistencia en branding.

## Pruebas de Validación

Antes del despliegue, se realizaron pruebas en:

Google Chrome, Firefox y Edge (últimas versiones).

Windows 10/11 y macOS.

Pantallas Full HD y dispositivos móviles.

Se validó:

Correcto funcionamiento del cálculo en ambas herramientas.

Eliminación total del scroll vertical no deseado.

Centrado visual uniforme de todos los componentes.



## Link de la página principal:

https://bill21ortega.github.io/Calculadoras_Tiendamia/


Navegar entre las calculadoras desde el menú principal o abriendo:

calculadoras/Fecha de entrega/index.html

calculadoras/Peso/index.html

👨‍💻 Autor y Mantenimiento

Autor: Willian Ortega
Año: 10/2025
Propósito: Uso interno y formativo dentro de Tiendamia.

“Este proyecto busca mejorar la eficiencia operativa del equipo de soporte mediante automatización de cálculos logísticos y estandarización de procesos.”