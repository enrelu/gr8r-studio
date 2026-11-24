/* ---------- PROJECTS ---------- */
import { ago, esc, fmtDate, minsAgo } from '../core/utils.js';
import { ic } from '../core/icons.js';
import { PSTAT } from '../core/constants.js';
import { S, SINGLE_USER, TM, canSee, mem, progressOf, tasksOf, visibleProjects } from '../core/store.js';
import { av, avStack, empty, pIcon, pStatus, pTypeBadge, progBar } from '../ui/helpers.js';

export function projectCard(p) {
  const ts = tasksOf(p.id);
  const pr = progressOf(p.id);
  const open = ts.filter(t => t.status !== 'done').length;
  const msTotal = (p.milestones || []).length;
  const msDone = (p.milestones || []).filter(m => m.done).length;
  const locked = !canSee(p);
  return `<div class="pcard" data-a="go" data-r="project" data-id="${p.id}" data-ctx="project" role="link" tabindex="0" aria-label="${esc(p.name)}">
    <div class="row">${pIcon(p)}<div class="grow" style="min-width:0"><div class="row" style="gap:6px"><b class="trunc" style="font-weight:600;font-size:14px">${esc(p.name)}</b>${p.fav ? `<span style="color:var(--amber)">${ic('star', 12)}</span>` : ''}${!SINGLE_USER && p.private ? `<span class="faint" data-tip="Proyecto privado">${ic('lock', 12)}</span>` : ''}</div></div>${pStatus(p.status)}</div>
    <div class="desc">${esc(p.desc)}</div>
    ${locked ? `<div class="row faint" style="font-size:12px">${ic('lock', 12)}Restringido — solicita acceso para ver las tareas</div>` : `<div class="row" style="gap:10px">${progBar(pr, p.status === 'complete' ? 'green' : p.status === 'risk' ? 'red' : '')}<span class="num" style="font-size:12px;font-weight:500">${pr}%</span></div>`}
    <div class="foot"><span class="row" style="gap:4px">${ic('circle-check', 12)}${locked ? '—' : `${ts.length - open}/${ts.length}`}</span>${msTotal ? `<span class="row" style="gap:4px" data-tip="Hitos">${ic('flag', 12)}${msDone}/${msTotal}</span>` : ''}<span class="row" style="gap:4px">${ic('calendar', 12)}${fmtDate(p.due)}</span><span class="sp"></span>${SINGLE_USER ? pTypeBadge(p.ptype) : avStack(p.members, 3)}</div>
    <button class="ibtn ibtn-sm more" data-a="ctxBtn" data-ctx="project" data-id="${p.id}" aria-label="Opciones del proyecto" style="background:var(--surface);box-shadow:0 0 0 1px var(--border)">${ic('ellipsis', 14)}</button>
  </div>`;
}
export function pageProjects() {
  const u = S.ui;
  const q = (u.projQ || '').toLowerCase();
  const st = u.projStatus || 'all';
  const sort = u.projSort || 'recent';
  let ps = visibleProjects().filter(p => (st === 'all' || p.status === st) && (!q || p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)));
  const sorter = { recent: p => p.last, name: p => p.name, due: p => p.due, progress: p => -progressOf(p.id) }[sort];
  ps.sort((a, b) => (sorter(a) > sorter(b) ? 1 : -1));
  const view = u.projView;
  let body;
  if (!visibleProjects().length)
    body = `<div class="panel">${empty('folder-kanban', 'Sin proyectos todavía', 'Crea tu primer proyecto para organizar tareas e hitos.', `<button class="btn btn-primary btn-sm" data-a="newProject">${ic('plus', 14)}Crear proyecto</button>`)}</div>`;
  else if (!ps.length)
    body = `<div class="panel">${empty('search-x', 'Sin resultados', 'Ningún proyecto coincide con la búsqueda o filtros.', `<button class="btn btn-secondary btn-sm" data-a="clearProjFilters">Limpiar filtros</button>`)}</div>`;
  else if (view === 'grid') body = `<div class="pgrid">${ps.map(projectCard).join('')}</div>`;
  else if (view === 'list')
    body = `<div class="panel" style="overflow:hidden">${ps
      .map(p => {
        const pr = progressOf(p.id);
        return `<div class="mini" style="min-height:52px;gap:12px" data-a="go" data-r="project" data-id="${p.id}" data-ctx="project">${pIcon(p)}<div class="grow" style="min-width:0"><div class="row" style="gap:6px"><b style="font-weight:500">${esc(p.name)}</b>${!SINGLE_USER && p.private ? ic('lock', 12) : ''}</div><div class="trunc faint" style="font-size:12px">${esc(p.desc)}</div></div><span class="hide-m">${pTypeBadge(p.ptype)}</span><span class="hide-m">${pStatus(p.status)}</span><span class="row hide-m" style="width:140px">${progBar(pr)}<span class="num faint" style="font-size:11.5px">${pr}%</span></span><span class="num muted hide-m" style="width:70px;font-size:12px">${fmtDate(p.due)}</span>${SINGLE_USER ? '' : avStack(p.members, 3)}<button class="ibtn ibtn-sm" data-a="ctxBtn" data-ctx="project" data-id="${p.id}" aria-label="Opciones">${ic('ellipsis', 14)}</button></div>`;
      })
      .join('')}</div>`;
  else
    body = `<div class="panel" style="overflow-x:auto"><table class="perm-t" style="min-width:${SINGLE_USER ? '720px' : '860px'}"><thead><tr><th style="padding-left:14px">Proyecto</th><th style="text-align:left">Tipo</th><th style="text-align:left">Estado</th>${SINGLE_USER ? '' : '<th style="text-align:left">Responsable</th><th style="text-align:left">Equipo</th>'}<th style="text-align:left;width:16%">Progreso</th><th>Tareas</th><th style="text-align:left">Inicio</th><th style="text-align:left">Objetivo</th><th style="text-align:left">Actividad</th><th></th></tr></thead><tbody>
    ${ps
      .map(p => {
        const ts = tasksOf(p.id);
        const pr = progressOf(p.id);
        return `<tr style="cursor:pointer" data-a="go" data-r="project" data-id="${p.id}" data-ctx="project"><td style="padding-left:14px"><span class="row">${pIcon(p, '', 14)}<span style="font-weight:500">${esc(p.name)}</span></span></td><td style="text-align:left">${pTypeBadge(p.ptype)}</td><td style="text-align:left">${pStatus(p.status)}</td>${SINGLE_USER ? '' : `<td style="text-align:left"><span class="row">${av(p.lead, 'sm')}${esc(mem(p.lead)?.name)}</span></td><td style="text-align:left" class="muted">${TM[p.team]?.name}</td>`}<td><span class="row">${progBar(pr)}<span class="num faint" style="font-size:11.5px">${pr}%</span></span></td><td class="num">${ts.length}</td><td style="text-align:left" class="num muted">${fmtDate(p.start)}</td><td style="text-align:left" class="num muted">${fmtDate(p.due)}</td><td style="text-align:left" class="muted">${ago(minsAgo(p.last))}</td><td><button class="ibtn ibtn-sm" data-a="ctxBtn" data-ctx="project" data-id="${p.id}" aria-label="Opciones">${ic('ellipsis', 14)}</button></td></tr>`;
      })
      .join('')}
    </tbody></table></div>`;
  return `<div class="page wide">
    <div class="ph"><div><h1>Proyectos</h1><p>${visibleProjects().filter(p => p.status !== 'complete').length} activos · ${visibleProjects().filter(p => p.status === 'complete').length} completados</p></div><div class="acts"><button class="btn btn-primary" data-a="newProject">${ic('plus', 14)}Nuevo proyecto</button></div></div>
    <div class="row" style="margin-bottom:16px;flex-wrap:wrap;gap:8px">
      <div class="inwrap">${ic('search', 13)}<input class="input search-sm" id="proj-q" data-in="projQ" placeholder="Buscar proyectos" value="${esc(u.projQ || '')}" aria-label="Buscar proyectos"></div>
      <select class="select" style="height:26px;width:auto;font-size:12px" data-in="projStatus" aria-label="Filtrar por estado"><option value="all">Todos los estados</option>${Object.entries(
        PSTAT,
      )
        .map(([k, v]) => `<option value="${k}" ${st === k ? 'selected' : ''}>${v.name}</option>`)
        .join('')}</select>
      <select class="select" style="height:26px;width:auto;font-size:12px" data-in="projSort" aria-label="Ordenar">${[
        ['recent', 'Actividad reciente'],
        ['name', 'Nombre'],
        ['due', 'Fecha objetivo'],
        ['progress', 'Progreso'],
      ]
        .map(([k, n]) => `<option value="${k}" ${sort === k ? 'selected' : ''}>Orden: ${n}</option>`)
        .join('')}</select>
      <span class="sp"></span>
      <div class="seg" role="tablist" aria-label="Vista">${[
        ['grid', 'Cuadrícula', 'layout-grid'],
        ['list', 'Lista', 'list'],
        ['table', 'Tabla', 'table-2'],
      ]
        .map(
          ([k, n, i]) =>
            `<button class="${view === k ? 'on' : ''}" data-a="set" data-k="projView" data-v="${k}" aria-label="${n}">${ic(i, 13)}<span class="hide-m">${n}</span></button>`,
        )
        .join('')}</div>
    </div>
    ${body}
  </div>`;
}
