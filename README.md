# Gr8r Studio

Espacio personal y ligero de gestión de proyectos y roadmaps en **español**, adaptado para **Desarrollo SW** y servicios de **Ciberseguridad**, con persistencia local en **PocketBase** y servidor **MCP** para llevar el seguimiento directamente desde **T3 Code**.

Construido con módulos ES de JavaScript vanilla y CSS, empaquetado con [Vite](https://vite.dev), sin frameworks de UI ni dependencias externas en tiempo de ejecución.

## Novedades de esta adaptación

- **Modo individual (`SINGLE_USER`):** oculta la gestión de equipos, miembros, bandeja, notificaciones, compartir, invitaciones, login/onboarding y subida de ficheros, dejando un entorno limpio para uso personal.
- **Proyectos de Desarrollo SW y Ciberseguridad:**
  - **Desarrollo SW** (`software`): vista predeterminada en **Tablero** y etiquetas técnicas (`Feature`, `Frontend`, `Backend / API`, `Bug`, `Refactor`, `Informe / Docs`).
  - **Ciberseguridad** (`cyber`): pensado para proyectos de servicios (auditoría, pentest, hardening), con vista predeterminada en **Lista** y etiquetas específicas (`Auditoría`, `Pentest`, `Hardening`, `Informe / Docs`).
  - Se conservan todas las vistas de proyecto: **Resumen**, **Tablero**, **Lista**, **Tabla**, **Calendario**, **Cronograma** y **Actividad**.
- **Hitos interactivos y plantillas iniciales:** gestión directa de hitos desde el resumen del proyecto y dos plantillas precargadas en español (`Proyecto Plantilla · Desarrollo SW` y `Servicio Plantilla · Ciberseguridad`).
- **Backend con PocketBase + respaldo en `localStorage`:** sincronización automática vía API REST (`/api`) contra las colecciones `projects`, `tasks` y `workspace`. Si PocketBase no está arrancado, sigue funcionando sobre `localStorage`.
- **Servidor MCP (`gr8r-proyectos`) para T3 Code:** servidor `stdio` sin dependencias externas (`scripts/mcp.js`) para consultar y actualizar proyectos, hitos, tareas, subtareas y comentarios desde cualquier hilo de T3 Code.

## Puesta en marcha

Requiere **Node.js 18 o superior** (`.nvmrc` fija Node 22).

```bash
npm install
```

### 1. Instalar PocketBase (Windows) y compilar la app

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-pb.ps1
npm run build:pb
```

### 2. Arrancar para uso diario

```bash
npm run pb        # Sirve la app y el API en http://127.0.0.1:8090
```

### Otros comandos útiles

```bash
npm run dev       # Servidor Vite en http://localhost:5173 (con proxy /api hacia PocketBase)
npm run build     # Compilación de producción en dist/
npm run build:pb  # Compilación de producción en pocketbase/pb_public/
npm run mcp       # Ejecuta el servidor MCP stdio (scripts/mcp.js)
npm run preview   # Sirve dist/ en local
npm run lint      # Comprobación con ESLint
npm run format    # Formateo con Prettier
```

## Integración MCP con T3 Code

El repositorio incluye [`.mcp.json`](.mcp.json) y el servidor [`scripts/mcp.js`](scripts/mcp.js) conectado a PocketBase (`PB_URL=http://127.0.0.1:8090`).

### Herramientas disponibles (`12`)

- **Estado:** `pb_health`
- **Proyectos e hitos:** `list_projects`, `get_project`, `create_project`, `update_project`, `manage_milestone`
- **Tareas y seguimiento:** `list_tasks`, `get_task`, `create_task`, `update_task`, `manage_subtask`, `add_comment`

### Configuración global en T3 Code

Para usar el MCP desde cualquier repositorio abierto en T3 Code (manteniendo `npm run pb` activo):

- **Antigravity / Gemini** (`%USERPROFILE%\.gemini\config\mcp_config.json`) o **Cursor** (`%USERPROFILE%\.cursor\mcp.json`):

```json
{
  "mcpServers": {
    "gr8r-proyectos": {
      "command": "node",
      "args": ["<ruta-al-repo>/scripts/mcp.js"],
      "env": {
        "PB_URL": "http://127.0.0.1:8090"
      }
    }
  }
}
```

- **Claude Code:** detecta automáticamente `.mcp.json` dentro de este repositorio, o puede añadirse de forma global en `%USERPROFILE%\.claude.json`.
- **Codex:** añadir `[mcp_servers.gr8r-proyectos]` en `%USERPROFILE%\.codex\config.toml`.

## Estructura del proyecto

```text
index.html                          Entrada HTML; carga src/main.js
public/favicon.svg                  Icono de la aplicación
vite.config.js                      Configuración de Vite (proxy /api y plugin virtual:icons)
eslint.config.js                    Reglas de ESLint (flat config) y Prettier (.prettierrc.json)
.mcp.json                           Definición del servidor MCP del proyecto
.github/workflows/ci.yml            CI: lint, format:check y build
pocketbase/
  pb_migrations/                    Migración inicial (colecciones projects, tasks, workspace)
scripts/
  pb.js                             Lanzador multiplataforma de PocketBase (npm run pb)
  mcp.js                            Servidor MCP stdio conectado a PocketBase (npm run mcp)
  setup-pb.ps1                      Descarga de pocketbase.exe en Windows
src/
  main.js                           Arranque: importa estilos/módulos e inicializa PocketBase
  styles/                           Hojas de estilo por capas (tokens, base, componentes, vistas)
  core/                             Utilidades, constantes, iconos, store, tema y cliente pb.js
  data/seed.js                      Plantillas iniciales en español (SW y Ciberseguridad)
  ui/                               Helpers de renderizado, toasts y selector personalizado
  shell/                            Router, render loop, barra lateral/superior y motor de vistas
  components/                       Renderizador de listas de tareas
  pages/                            Páginas de ruta (inicio, proyectos, resumen, ajustes, etc.)
  views/                            Vistas de proyecto (resumen, tablero, tabla, calendario, cronograma)
  overlays/                         Drawer de tarea, modales, popovers, menú contextual y paleta
  features/                         Subtareas y archivo
  actions/                          Mutaciones de estado, eventos, atajos de teclado y drag & drop
```

### Arquitectura por capas

Las dependencias fluyen en un único sentido:

1. `core/` y `data/` no dependen del resto de la aplicación.
2. `ui/`, `shell/`, `components/`, `pages/`, `views/`, `overlays/` y `features/` generan HTML a partir del estado (`S`).
3. `actions/` mutan el estado, persisten en `localStorage` + PocketBase y disparan `render()`.

## Convenciones

- **Renderizado:** cada página o vista devuelve una cadena HTML desde el store (`S`). `render()` reconstruye el shell conservando foco y posición de scroll.
- **Interacciones:** los elementos declaran `data-a="nombreAccion"` (`actions/events.js` delega en `A.nombreAccion`), `data-in` para inputs y `data-blur` para pérdida de foco.
- **Diseño e iconos:** márgenes alineados mediante `--gutter` y carga optimizada de [Lucide](https://lucide.dev) con `ic('nombre')` mediante `virtual:icons`.

## Integración continua

Cada push y pull request en `main` ejecuta `npm run lint`, `npm run format:check` y `npm run build` (`.github/workflows/ci.yml`).
