# EnlaceVRC — Documentación (SPA estática)

Página de documentación del bot EnlaceVRC. HTML/CSS/JS sin framework ni paso de build, lista para
**Cloudflare Pages** (no Workers).

## Estructura

```
static/
├── index.html        # Toda la documentación (una sola página)
├── css/styles.css    # Estilos (tema cianotipo)
├── js/app.js         # Scrollspy, buscador del sidebar, menú móvil
├── js/effects.js     # Capa visual: smooth scroll, reveal al scroll, grano, lightbox
├── img/              # Íconos cianotipo del bot usados en la página
├── _headers          # Cabeceras de seguridad y caché para Pages
└── README.md         # Este archivo
```

Dependencias vía CDN (todas opcionales — la página funciona sin ellas):

| Librería | Para qué | Tamaño aprox. |
|---|---|---|
| Google Fonts | Tipografías Inter + JetBrains Mono | — |
| [AOS](https://michalsnik.github.io/aos/) | Animaciones al hacer scroll | ~14 KB |
| [Lenis](https://github.com/darkroomengineering/lenis) | Smooth scroll | ~6 KB |
| [GLightbox](https://biati-digital.github.io/glightbox/) | Visor de imágenes ampliadas | ~10 KB |

Todos los efectos respetan `prefers-reduced-motion`: si el sistema pide menos movimiento, no
se activan animaciones, smooth scroll ni el grano animado.

## Desarrollo local

Sírvela con cualquier servidor estático desde esta carpeta, por ejemplo:

```bash
npx serve static
# o
python -m http.server -d static 8080
```

Abrir un servidor (en vez de `file://`) hace que funcionen las rutas absolutas `/css/...` y `/js/...`.

## Desplegar en Cloudflare Pages

### Opción A — Dashboard (Git)

1. Crea un proyecto en **Cloudflare Pages** conectado a este repositorio.
2. Framework preset: **None**.
3. Build command: *(vacío)*.
4. **Build output directory:** `static`.

### Opción B — Wrangler (directo)

```bash
npx wrangler pages deploy static --project-name enlacevrc-docs
```

No requiere un Worker: Pages sirve los archivos estáticos tal cual.
