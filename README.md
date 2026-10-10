# Portafolio Web — Jonathan A. Martínez

Hola. Soy Jonathan A. Martínez, desarrollador web radicado en la Ciudad de México. Este repositorio contiene el código fuente de mi portafolio personal, donde muestro mis proyectos más recientes, mi enfoque de trabajo y cómo contacto con nuevos clientes.

## Sobre el proyecto

El objetivo de este sitio es ofrecer una experiencia digital rápida, responsiva y con personalidad. Está diseñado no solo para mostrar mi trabajo, sino para demostrar atención al detalle en el desarrollo frontend.

### Características principales:
- **Hero 3D:** esfera de partículas, anillos orbitales y malla en **Three.js** (shaders propios) que reaccionan al cursor y al scroll; se carga de forma diferida y se omite con "reducir movimiento".
- **Glassmorphism:** sistema de vidrio (blur + borde con brillo) sobre un fondo de auroras animadas, cuadrícula y un halo que sigue al cursor.
- **Proyectos con profundidad:** tarjetas con inclinación 3D, reflejo de luz, capas en `translateZ` y parallax en las capturas.
- **Chips de tecnología por proyecto:** logo y color de marca de cada tecnología (Simple Icons) y **filtros animados** con GSAP Flip.
- **Sección de stack:** tecnologías agrupadas, con el número de proyectos que usan cada una calculado a partir de las tarjetas.
- **Microinteracciones:** titulares que aparecen palabra por palabra, etiquetas que se "descifran", contadores, código que se escribe solo, botones magnéticos y barra de progreso de scroll.
- **Modo claro / oscuro** con preferencia guardada, **100% responsivo** y respetuoso de `prefers-reduced-motion`.

## Tecnologías utilizadas

- **HTML5** semántico y accesible.
- **CSS3** puro (Custom Properties, Grid, `color-mix`, `@property`, `backdrop-filter`, máscaras).
- **Vanilla JavaScript** (ES6+).
- [**Three.js**](https://threejs.org/) para la escena 3D del hero.
- [**GSAP**](https://gsap.com/) con ScrollTrigger y Flip para animaciones.
- [**Lenis**](https://lenis.darkroom.engineering/) para el smooth scrolling.
- [**Simple Icons**](https://simpleicons.org/) para los logos de tecnologías.

## Estructura de archivos

- `index.html`: estructura principal del sitio (single page).
- `styles.css`: tokens de diseño, sistema glass, componentes, responsive y mapa de colores/íconos por tecnología (`[data-tech]`).
- `script.js`: interacciones, tema, animaciones GSAP, filtros y escena Three.js.
- `img/`: capturas y foto optimizadas en WebP.

Para agregar un proyecto, duplica un `<article class="project-card">`, ajusta `data-tags` (filtros) y su lista de `.tech`; los contadores de filtros y del stack se actualizan solos.

## Ver el proyecto en vivo

Puedes visitar mi portafolio directamente aquí:
https://jonmtzdev.github.io/micv/

---
Diseñado y construido con intención.
