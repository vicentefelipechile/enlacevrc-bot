# EnlaceVRC — Documentación (SPA estática)

Página de documentación del bot EnlaceVRC. HTML/CSS/JS sin framework ni paso de build, lista para
**Cloudflare Pages** (no Workers).

## Estructura

```
static/
├── index.html        # Toda la documentación (una sola página)
├── css/styles.css    # Estilos (tema claro/oscuro automático)
├── js/app.js         # Scrollspy, buscador del sidebar, menú móvil
├── _headers          # Cabeceras de seguridad y caché para Pages
└── README.md         # Este archivo
```

Tipografías servidas por Google Fonts (CDN); el resto es local.

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
