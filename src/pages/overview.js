/* ---------- WORKSPACE OVERVIEW ---------- */
import { TODAY, diffD, esc, fmtDate, parse, relDate } from '../core/utils.js';
import { ic } from '../core/icons.js';
import { STATUSES } from '../core/constants.js';
import { D, SINGLE_USER, allTasks, canSee, isOver, mem, pColor, progressOf, tasksOf, visibleProjects } from '../core/store.js';
import { av, pIcon, pStatus, pTypeBadge, progBar, stIcon } from '../ui/helpers.js';

export function pageOverview() {
  const ps = visibleProjects().filter(canSee);
  const all = allTasks();
  const done = all.filter(t => t.status === 'done').length;
  const counts = STATUSES.map(s => ({ s, n: all.filter(t => t.status === s.id).length }));
  const allMs = ps.flatMap(p => (p.milestones || []).map(m => ({ ...m, p })));
  const ms = allMs
    .filter(m => !m.done)
    .sort((a, b) => ((a.date || '9999') > (b.date || '9999') ? 1 : -1))
    .slice(0, 6);
  const load = D()
    .members.filter(m => m.status === 'active')
    .map(m => ({ m, ts: all.filter(t => t.assignee === m.id && t.status !== 'done') }))
    .sort((a, b) => b.ts.length - a.ts.length);
  const maxL = Math.max(...load.map(l => l.ts.length), 1);
  return `<div class="page">
    <div class="ph"><div><h1>Resumen general</h1><p>Estado de todos los proyectos en ${esc(D().ws.name)}.</p></div><div class="acts"><button class="btn btn-secondary" data-a="go" data-r="timeline">${ic('chart-gantt', 14)}Cronograma</button><button class="btn btn-primary" data-a="newProject">${ic('plus', 14)}Nuevo proyecto</button></div></div>
    <div class="stats" style="margin-bottom:16px">
      <div class="stat"><span class="k">Proyectos</span><span class="v">${ps.length}</span><span class="d">${ps.filter(p => p.status === 'complete').length} completados</span></div>
      <div class="stat"><span class="k">Tareas</span><span class="v">${all.length}</span><span class="d">${all.length - done} abiertas</span></div>
      <div class="stat"><span class="k">Tasa de avance</span><span class="v">${Math.round((done / Math.max(all.length, 1)) * 100)}%</span><span class="d">en todos los proyectos</span></div>
      ${
        SINGLE_USER
          ? `<div class="stat"><span class="k">Hitos pendientes</span><span class="v">${allMs.filter(m => !m.done).length}</span><span class="d">${allMs.filter(m => m.done).length} completados</span></div>`
          : `<div class="stat"><span class="k">Miembros</span><span class="v">${D().members.length}</span><span class="d">${D().members.filter(m => m.status === 'invited').length} invitaciones</span></div>`
      }
    </div>
    <div class="grid2">
      <section class="panel"><div class="panel-h"><h2>Cartera de proyectos</h2></div>
        <div style="overflow-x:auto"><table class="perm-t" style="min-width:580px"><thead><tr><th style="padding-left:14px">Proyecto</th><th style="text-align:left">${SINGLE_USER ? 'Tipo' : 'Responsable'}</th><th style="text-align:left">Estado</th><th style="text-align:left;width:22%">Progreso</th><th>Abiertas</th><th>Vencidas</th><th style="text-align:left">Objetivo</th></tr></thead><tbody>
        ${ps
          .map(p => {
            const ts = tasksOf(p.id);
            const pr = progressOf(p.id);
            const ov = ts.filter(isOver).length;
            return `<tr style="cursor:pointer" data-a="go" data-r="project" data-id="${p.id}" data-tab="overview"><td style="padding-left:14px"><span class="row">${pIcon(p, '', 14)}<span class="trunc" style="font-weight:500">${esc(p.name)}</span></span></td><td style="text-align:left">${SINGLE_USER ? pTypeBadge(p.ptype) : `<span class="row">${av(p.lead, 'sm')}<span class="muted trunc">${esc(mem(p.lead)?.name.split(' ')[0])}</span></span>`}</td><td style="text-align:left">${pStatus(p.status)}</td><td><span class="row">${progBar(pr, p.status === 'complete' ? 'green' : p.status === 'risk' ? 'red' : '')}<span class="num faint" style="font-size:11.5px;width:30px">${pr}%</span></span></td><td class="num">${ts.filter(t => t.status !== 'done').length}</td><td class="num" style="${ov ? 'color:var(--red)' : 'color:var(--text-3)'}">${ov}</td><td style="text-align:left" class="num muted">${fmtDate(p.due)}</td></tr>`;
          })
          .join('')}
        </tbody></table></div>
      </section>
      <div class="stack">
        <section class="panel"><div class="panel-h"><h2>Tareas por estado</h2></div><div class="panel-b">
          <div class="stackbar" style="height:10px;margin-bottom:12px">${counts.map(c => `<i style="width:${(c.n / Math.max(all.length, 1)) * 100}%;background:var(--st-${c.s.id})" title="${c.s.name}: ${c.n}"></i>`).join('')}</div>
          ${counts.map(c => `<div class="row" style="height:28px;font-size:13px">${stIcon(c.s.id)}<span class="grow">${c.s.name}</span><span class="num muted">${c.n}</span><span class="num faint" style="width:36px;text-align:right">${Math.round((c.n / Math.max(all.length, 1)) * 100)}%</span></div>`).join('')}
        </div></section>
        ${
          SINGLE_USER
            ? ''
            : `<section class="panel"><div class="panel-h"><h2>Carga de trabajo</h2><div class="acts"><span class="faint" style="font-size:11.5px">Tareas abiertas por persona</span></div></div><div class="panel-b">
          ${load
            .map(
              l =>
                `<div class="row" style="height:30px;font-size:13px;cursor:pointer" data-a="go" data-r="member" data-id="${l.m.id}">${av(l.m.id, 'sm', false)}<span style="width:96px" class="trunc">${esc(l.m.name.split(' ')[0])}</span><span class="grow" style="display:flex;height:8px;border-radius:4px;overflow:hidden;background:var(--surface-3)"><span style="display:flex;width:${(l.ts.length / maxL) * 100}%">${STATUSES.filter(
                  s => s.id !== 'done',
                )
                  .map(s => {
                    const n = l.ts.filter(t => t.status === s.id).length;
                    return n ? `<i style="display:block;flex:${n};background:var(--st-${s.id})"></i>` : '';
                  })
                  .join('')}</span></span><span class="num muted" style="width:22px;text-align:right">${l.ts.length}</span></div>`,
            )
            .join('')}
        </div></section>`
        }
        <section class="panel"><div class="panel-h"><h2>Próximos hitos</h2></div><div class="panel-b">
          ${
            ms
              .map(m => {
                const overMs = m.date && diffD(parse(m.date), TODAY) < 0;
                return `<div class="row" style="height:32px;font-size:13px;cursor:pointer" data-a="go" data-r="project" data-id="${m.p.id}" data-tab="overview"><span style="width:9px;height:9px;transform:rotate(45deg);background:${overMs ? 'var(--red)' : pColor(m.p)};border-radius:2px;flex-shrink:0;margin:0 3px"></span><span class="grow trunc">${esc(m.name)} <span class="faint">· ${esc(m.p.name)}</span></span><span class="num ${overMs ? '' : 'muted'}" style="${overMs ? 'color:var(--red)' : ''}">${m.date ? relDate(m.date) : 'Sin fecha'}</span></div>`;
              })
              .join('') || '<div class="faint">Sin hitos pendientes</div>'
          }
        </div></section>
      </div>
    </div>
  </div>`;
}
