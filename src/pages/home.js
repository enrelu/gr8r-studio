/* ---------- HOME ---------- */
import { DAY, MONL, TODAY, WDL, diffD, esc, fmtDate, parse } from '../core/utils.js';
import { ic } from '../core/icons.js';
import { D, S, SINGLE_USER, allTasks, canSee, isOver, pColor, progressOf, proj, visibleProjects } from '../core/store.js';
import { av, avStack, empty, pIcon, pStatus, pTypeBadge, prIcon, progBar } from '../ui/helpers.js';
import { sortTasks } from '../shell/view-engine.js';
import { actHtml, miniRow } from '../components/task-list.js';

export function pageHome() {
  const h = new Date().getHours();
  const greet = h < 13 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
  const all = allTasks();
  const mineAll = SINGLE_USER ? all : all.filter(t => t.assignee === D().me);
  const activeP = visibleProjects().filter(p => canSee(p) && p.status !== 'complete');
  const open = all.filter(t => t.status !== 'done');
  const doneWk = all.filter(t => t.status === 'done' && t.completedAt && Date.now() - t.completedAt < 7 * DAY);
  const over = all.filter(isOver);
  const tab = S.ui.homeTab;
  const lists = {
    upcoming: sortTasks(
      mineAll.filter(t => t.status !== 'done' && !isOver(t)),
      { f: 'due', dir: 1 },
    ),
    overdue: mineAll.filter(isOver),
    completed: sortTasks(
      mineAll.filter(t => t.status === 'done'),
      { f: 'updated', dir: 1 },
    ),
  };
  const cur = lists[tab].slice(0, 7);
  const dl = (lab, a, b) => {
    const ts = sortTasks(
      open.filter(t => t.due && diffD(parse(t.due), TODAY) >= a && diffD(parse(t.due), TODAY) <= b),
      { f: 'priority', dir: 1 },
    );
    return { lab, ts };
  };
  const dls = [dl('Hoy', 0, 0), dl('Mañana', 1, 1), dl('Esta semana', 2, 7)];
  return `<div class="page">
    <div class="ph"><div><h1>${SINGLE_USER ? greet : `${greet}, ${esc(S.prefs.name.split(' ')[0])}`}</h1><p><span class="num">${WDL[TODAY.getDay()]}, ${TODAY.getDate()} de ${MONL[TODAY.getMonth()].toLowerCase()}</span> · Resumen de tus proyectos y tareas.</p></div>
      <div class="acts">${SINGLE_USER ? '' : `<button class="btn btn-secondary hide-m" data-a="invite">${ic('user-plus', 14)}Invitar miembro</button>`}<button class="btn btn-secondary hide-m" data-a="newProject">${ic('folder-plus', 14)}Nuevo proyecto</button><button class="btn btn-primary" data-a="newTask">${ic('plus', 14)}Nueva tarea</button></div></div>
    <div class="stats" style="margin-bottom:16px">
      <button class="stat" data-a="go" data-r="projects"><span class="k">${ic('folder-kanban', 14)}Proyectos activos</span><span class="v">${activeP.length}</span><span class="d">${activeP.filter(p => p.status === 'risk').length} en riesgo</span></button>
      <button class="stat" data-a="goTasks" data-f="open"><span class="k">${ic('circle-dashed', 14)}Tareas abiertas</span><span class="v">${open.length}</span><span class="d">${SINGLE_USER ? `${open.filter(t => t.status === 'progress').length} en progreso` : `${open.filter(t => t.assignee === D().me).length} asignadas a ti`}</span></button>
      <button class="stat" data-a="goTasks" data-f="done"><span class="k">${ic('circle-check', 14)}Completadas</span><span class="v">${doneWk.length}</span><span class="d up">esta semana</span></button>
      <button class="stat" data-a="goTasks" data-f="overdue"><span class="k">${ic('clock-alert', 14)}Vencidas</span><span class="v" style="${over.length ? 'color:var(--red)' : ''}">${over.length}</span><span class="d ${over.length ? 'bad' : ''}">${over.length ? 'requieren atención' : 'todo al día'}</span></button>
    </div>
    <div class="grid2">
      <div class="stack">
        <section class="panel" aria-labelledby="h-mytasks">
          <div class="panel-h"><h2 id="h-mytasks">Mis tareas</h2>
            <div class="acts"><div class="seg" role="tablist">${[
              ['upcoming', 'Próximas'],
              ['overdue', 'Vencidas'],
              ['completed', 'Completadas'],
            ]
              .map(
                ([k, n]) =>
                  `<button role="tab" class="${tab === k ? 'on' : ''}" data-a="set" data-k="homeTab" data-v="${k}">${n} <span class="faint">${lists[k].length}</span></button>`,
              )
              .join('')}</div>
            <button class="ibtn ibtn-sm" data-a="go" data-r="mytasks" data-tip="Abrir Mis tareas" aria-label="Abrir Mis tareas">${ic('arrow-up-right', 15)}</button></div></div>
          ${cur.length ? cur.map(t => miniRow(t, { av: false })).join('') : empty(tab === 'overdue' ? 'circle-check' : 'list-checks', tab === 'overdue' ? 'Nada vencido' : 'Sin tareas aquí', tab === 'overdue' ? 'Todas tus tareas están dentro de plazo.' : 'Añade una tarea para empezar.', '', 'sm')}
          ${lists[tab].length > 7 ? `<button class="addrow" style="padding-left:14px;border-top:1px solid var(--divider);border-bottom:0" data-a="go" data-r="mytasks">Ver las ${lists[tab].length} tareas ${ic('arrow-right', 13)}</button>` : ''}
        </section>
        <section class="panel">
          <div class="panel-h"><h2>Progreso de proyectos</h2><div class="acts"><button class="btn btn-sm btn-ghost" data-a="go" data-r="projects">Todos los proyectos</button></div></div>
          <div style="overflow-x:auto"><table class="perm-t" style="min-width:540px"><thead><tr><th style="padding-left:14px">Proyecto</th><th style="text-align:left">Estado</th><th style="text-align:left;width:26%">Progreso</th><th style="text-align:left">Objetivo</th><th style="text-align:right;padding-right:14px">${SINGLE_USER ? 'Tipo' : 'Equipo'}</th></tr></thead><tbody>
          ${activeP
            .filter(canSee)
            .map(p => {
              const pr = progressOf(p.id);
              return `<tr style="cursor:pointer" data-a="go" data-r="project" data-id="${p.id}" data-tab="overview"><td style="padding-left:14px"><span class="row">${pIcon(p, '', 14)}<b style="font-weight:500">${esc(p.name)}</b></span></td><td style="text-align:left">${pStatus(p.status)}</td><td><span class="row">${progBar(pr, p.status === 'risk' ? 'red' : '')}<span class="num faint" style="font-size:11.5px;width:30px">${pr}%</span></span></td><td style="text-align:left" class="num muted">${fmtDate(p.due)}</td><td style="text-align:right;padding-right:14px">${SINGLE_USER ? pTypeBadge(p.ptype) : avStack(p.members, 3)}</td></tr>`;
            })
            .join('')}
          </tbody></table></div>
        </section>
      </div>
      <div class="stack">
        <section class="panel">
          <div class="panel-h"><h2>Próximas entregas</h2><div class="acts"><button class="btn btn-sm btn-ghost" data-a="go" data-r="calendar">${ic('calendar', 13)}Calendario</button></div></div>
          <div class="panel-b" style="padding-bottom:6px">
          ${dls
            .map(
              g => `<div style="margin-bottom:10px"><div class="row" style="font-size:11.5px;font-weight:600;color:var(--text-2);margin-bottom:4px">${g.lab}<span class="faint" style="font-weight:500">${g.ts.length}</span></div>
            ${
              g.ts.length
                ? g.ts
                    .slice(0, 4)
                    .map(
                      t =>
                        `<div class="row" style="height:30px;cursor:pointer;gap:8px;font-size:13px" data-a="openTask" data-id="${t.id}"><span class="pdot" style="--c:${pColor(proj(t.project))}"></span><span class="trunc grow">${esc(t.title)}</span>${prIcon(t.priority, 13)}${SINGLE_USER ? '' : av(t.assignee, 'sm')}</div>`,
                    )
                    .join('') + (g.ts.length > 4 ? `<div class="faint" style="font-size:11.5px;padding-left:16px">+${g.ts.length - 4} más</div>` : '')
                : `<div class="faint" style="font-size:12.5px;padding:4px 0 2px">Sin entregas</div>`
            }</div>`,
            )
            .join('')}
          </div>
        </section>
        <section class="panel">
          <div class="panel-h"><h2>Actividad reciente</h2><div class="acts"><button class="btn btn-sm btn-ghost" data-a="go" data-r="activity">Ver todo</button></div></div>
          <div class="panel-b feed lined">${D()
            .activity.slice(0, 7)
            .map(a => actHtml(a, { proj: true }))
            .join('')}</div>
        </section>
      </div>
    </div>
  </div>`;
}
