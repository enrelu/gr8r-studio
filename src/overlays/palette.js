/* ---------------- COMMAND PALETTE ---------------- */
import { MOD, clamp, esc } from '../core/utils.js';
import { LOGO, ic, wsLogo } from '../core/icons.js';
import { PSTAT } from '../core/constants.js';
import { D, S, SINGLE_USER, allTasks, pColor, proj, save, task } from '../core/store.js';
import { FT, av, hl, stIcon } from '../ui/helpers.js';
import { effectiveDark } from '../core/theme.js';
import { go, render } from '../shell/render.js';
import { sortTasks } from '../shell/view-engine.js';
import { searchAll } from '../pages/search.js';
import { openModal } from './modals.js';
import { A } from '../actions/actions.js';

export function commands() {
  return [
    { id: 'c-task', name: 'Crear tarea', icon: 'plus', kbd: 'N', run: () => A.newTask(document.body) },
    { id: 'c-proj', name: 'Crear proyecto', icon: 'folder-plus', kbd: 'P', run: () => A.newProject() },
    {
      id: 'c-search',
      name: 'Buscar en el espacio',
      icon: 'search',
      kbd: '/',
      run: () => {
        S.ui.palette = { q: '', mode: 'search', scope: 'all', hl: 0 };
        render();
      },
    },
    { id: 'c-home', name: 'Ir a Inicio', icon: 'house', kbd: 'G H', run: () => go('home') },
    ...(SINGLE_USER ? [] : [{ id: 'c-inbox', name: 'Ir a Bandeja', icon: 'inbox', kbd: 'G I', run: () => go('inbox') }]),
    { id: 'c-my', name: 'Ir a Mis tareas', icon: 'circle-check', kbd: 'G T', run: () => go('mytasks') },
    { id: 'c-projs', name: 'Ir a Proyectos', icon: 'folder-kanban', kbd: 'G P', run: () => go('projects') },
    { id: 'c-cal', name: 'Ir a Calendario', icon: 'calendar', kbd: 'G C', run: () => go('calendar') },
    { id: 'c-tl', name: 'Ir a Cronograma', icon: 'chart-gantt', run: () => go('timeline') },
    { id: 'c-act', name: 'Ir a Actividad', icon: 'activity', kbd: 'G A', run: () => go('activity') },
    ...(SINGLE_USER ? [] : [{ id: 'c-mem', name: 'Ir a Miembros', icon: 'users', run: () => go('members') }]),
    { id: 'c-set', name: 'Abrir ajustes', icon: 'settings', kbd: 'G S', run: () => go('settings') },
    { id: 'c-app', name: 'Ajustes de apariencia', icon: 'palette', run: () => go('settings', { sec: 'appearance' }) },
    ...(SINGLE_USER
      ? []
      : [
          {
            id: 'c-ws',
            name: 'Cambiar de espacio…',
            icon: 'arrow-left-right',
            run: () => {
              S.ui.palette = { q: '', mode: 'ws', hl: 0 };
              render();
            },
          },
        ]),
    {
      id: 'c-dark',
      name: effectiveDark() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro',
      icon: effectiveDark() ? 'sun' : 'moon',
      kbd: MOD + ' ⇧ L',
      run: () => A.toggleDark(),
    },
    ...(SINGLE_USER ? [] : [{ id: 'c-inv', name: 'Invitar miembro', icon: 'user-plus', run: () => A.invite() }]),
    { id: 'c-side', name: 'Mostrar/ocultar barra lateral', icon: 'panel-left', kbd: '[', run: () => A.toggleSide() },
    { id: 'c-keys', name: 'Atajos de teclado', icon: 'keyboard', kbd: '?', run: () => A.shortcuts() },
    ...(SINGLE_USER ? [] : [{ id: 'c-out', name: 'Cerrar sesión', icon: 'log-out', run: () => A.signOut() }]),
  ];
}
export function paletteItems() {
  const pl = S.ui.palette;
  const q = pl.q.trim();
  const ql = q.toLowerCase();
  const groups = [];
  if (pl.mode === 'ws') {
    groups.push({
      name: 'Cambiar de espacio',
      items: D()
        .workspaces.filter(w => !q || w.name.toLowerCase().includes(ql))
        .map(w => ({ html: `${wsLogo(w, 20)}`, name: w.name, sub: w.plan, run: () => A.switchWs({ dataset: { v: w.id } }) })),
    });
    return groups;
  }
  if (pl.mode === 'cmd') {
    const cmds = commands().filter(c => !q || c.name.toLowerCase().includes(ql));
    if (!q) {
      groups.push({
        name: 'Sugerencias',
        items: cmds.slice(0, 3).concat(cmds.filter(c => c.id === 'c-dark' || (!SINGLE_USER && c.id === 'c-ws'))),
      });
      const recent = sortTasks(
        allTasks().filter(t => SINGLE_USER || t.assignee === D().me || t.fav),
        { f: 'updated', dir: 1 },
      ).slice(0, 4);
      groups.push({
        name: 'Tareas recientes',
        items: recent.map(t => ({
          html: stIcon(t.status),
          name: t.title,
          sub: proj(t.project).name,
          r: t.key,
          run: () => A.openTask({ dataset: { id: t.id } }),
        })),
      });
      groups.push({ name: 'Navegación', items: cmds.filter(c => c.id.startsWith('c-') && c.name.startsWith('Ir a')) });
      return groups;
    }
    if (cmds.length) groups.push({ name: 'Comandos', items: cmds.slice(0, 5) });
  }
  const r = searchAll(q);
  const sc = pl.mode === 'search' ? pl.scope : 'all';
  const lim = sc === 'all' ? 4 : 12;
  if (pl.mode === 'search' && !q) {
    if (D().recentSearches.length) {
      groups.push({
        name: 'Búsquedas recientes',
        items: D().recentSearches.map(s => ({
          icon: 'history',
          name: s,
          run: () => {
            pl.q = s;
            pl.hl = 0;
            render();
          },
        })),
      });
    }
    const p1 = proj('p1');
    const p2 = proj('p2');
    groups.push({
      name: 'Sugerencias',
      items: [
        { icon: 'clock-alert', name: 'Tareas vencidas', run: () => A.goTasks({ dataset: { f: 'overdue' } }) },
        { icon: 'circle-check', name: 'Mis tareas pendientes', run: () => go('mytasks') },
        ...(p1 ? [{ icon: 'code', name: p1.name, run: () => go('project', { id: p1.id }) }] : []),
        ...(p2 ? [{ icon: 'shield', name: p2.name, run: () => go('project', { id: p2.id }) }] : []),
      ],
    });
    return groups;
  }
  if (!q) return groups;
  if (sc === 'all' || sc === 'tasks')
    groups.push({
      name: 'Tareas',
      items: r.tasks
        .slice(0, lim)
        .map(t => ({ html: stIcon(t.status), name: t.title, sub: proj(t.project).name, r: t.key, run: () => A.openTask({ dataset: { id: t.id } }) })),
    });
  if (sc === 'all' || sc === 'projects')
    groups.push({
      name: 'Proyectos',
      items: r.projects.slice(0, lim).map(p => ({
        html: `<span class="pdot" style="--c:${pColor(p)}"></span>`,
        name: p.name,
        sub: PSTAT[p.status].name,
        run: () => go('project', { id: p.id }),
      })),
    });
  if (!SINGLE_USER && (sc === 'all' || sc === 'people'))
    groups.push({
      name: 'Personas',
      items: r.people.slice(0, lim).map(m => ({ html: av(m.id, 'sm', false), name: m.name, sub: m.title, run: () => go('member', { id: m.id }) })),
    });
  if (!SINGLE_USER && (sc === 'all' || sc === 'files'))
    groups.push({
      name: 'Archivos',
      items: r.files.slice(0, lim).map(f => ({
        icon: FT[f.type].i,
        name: f.name,
        sub: proj(f.project).name,
        r: f.size,
        run: () => openModal({ type: 'filePreview', file: f, tid: f.task }),
      })),
    });
  if (sc === 'all' || sc === 'comments')
    groups.push({
      name: 'Notas',
      items: r.comments.slice(0, lim).map(c => ({
        html: SINGLE_USER ? ic('message-square', 14) : av(c.by, 'sm', false),
        name: c.text,
        sub: 'en ' + task(c.task).title,
        run: () => A.openTask({ dataset: { id: c.task } }),
      })),
    });
  const out = groups.filter(g => g.items.length);
  out.push({
    name: '',
    items: [
      {
        icon: 'search',
        name: `Ver todos los resultados para “${q}”`,
        run: () => {
          S.ui.searchQ = q;
          S.ui.searchCat = sc;
          if (!D().recentSearches.includes(q)) D().recentSearches.unshift(q);
          D().recentSearches = D().recentSearches.slice(0, 5);
          save();
          go('search');
        },
      },
    ],
  });
  return out;
}
export function paletteHtml() {
  const pl = S.ui.palette;
  const groups = paletteItems();
  const flat = groups.flatMap(g => g.items);
  pl._flat = flat;
  pl.hl = clamp(pl.hl, 0, Math.max(flat.length - 1, 0));
  let idx = 0;
  const ph =
    pl.mode === 'search'
      ? SINGLE_USER
        ? 'Buscar tareas, proyectos, notas…'
        : 'Buscar tareas, proyectos, personas, archivos, notas…'
      : pl.mode === 'ws'
        ? 'Buscar espacio de trabajo…'
        : 'Escribe un comando o busca…';
  const scopes = [
    ['all', 'Todo', 'layers'],
    ['tasks', 'Tareas', 'circle-check'],
    ['projects', 'Proyectos', 'folder'],
    ...(SINGLE_USER
      ? []
      : [
          ['people', 'Personas', 'users'],
          ['files', 'Archivos', 'paperclip'],
        ]),
    ['comments', 'Notas', 'message-square'],
  ];
  return `<div class="palette" role="dialog" aria-modal="true" aria-label="Menú de comandos">
    <div class="pal-in">${ic(pl.mode === 'search' ? 'search' : 'command', 17)}${pl.mode !== 'cmd' ? `<span class="badge" style="flex-shrink:0">${pl.mode === 'search' ? 'Buscar' : 'Espacio'}</span>` : ''}<input id="pal-in" data-in="palQ" value="${esc(pl.q)}" placeholder="${ph}" autocomplete="off" role="combobox" aria-expanded="true" aria-controls="pal-list" aria-activedescendant="pi-${pl.hl}"><kbd>Esc</kbd></div>
    ${
      pl.mode === 'search'
        ? `<div class="pal-scope" role="tablist">${scopes
            .map(([k, n, i]) => `<button role="tab" class="${pl.scope === k ? 'on' : ''}" data-a="palScope" data-v="${k}">${ic(i, 12)}${n}</button>`)
            .join('')}</div>`
        : ''
    }
    <div class="pal-list" id="pal-list" role="listbox">${
      flat.length
        ? groups
            .map(
              g =>
                `<div class="pal-group">${g.name ? `<div class="pal-sec">${g.name}</div>` : ''}${g.items
                  .map(it => {
                    const i = idx++;
                    return `<div class="pi ${i === pl.hl ? 'hl' : ''}" id="pi-${i}" role="option" aria-selected="${i === pl.hl}" data-a="palRun" data-i="${i}" data-hover-i="${i}">${it.html || ic(it.icon || 'circle', 15)}<span class="trunc">${hl(it.name, pl.q.trim())}</span>${it.sub ? `<span class="sub">${esc(it.sub)}</span>` : ''}<span class="r">${it.r ? `<span class="mono">${esc(it.r)}</span>` : ''}${
                      it.kbd
                        ? it.kbd
                            .split(' ')
                            .map(k => `<kbd>${k}</kbd>`)
                            .join('')
                        : ''
                    }</span></div>`;
                  })
                  .join('')}</div>`,
            )
            .join('')
        : `<div class="empty-state sm"><div class="glyph">${ic('search-x', 18)}</div><h2 class="es-h">Sin resultados</h2><p>Prueba otra palabra o pulsa Tab para volver a comandos.</p></div>`
    }</div>
    <div class="pal-f"><span><kbd>↑</kbd><kbd>↓</kbd>navegar</span><span><kbd>↵</kbd>seleccionar</span>${pl.mode === 'cmd' ? '<span><kbd>Tab</kbd>modo búsqueda</span>' : '<span><kbd>⌫</kbd>volver a comandos</span>'}<span class="sp" style="flex:1"></span><span>${LOGO(12)}</span></div>
  </div>`;
}
