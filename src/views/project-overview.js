/* ---------- OVERVIEW ---------- */
import { TODAY, dayBucket, diffD, esc, fmtDate, parse } from '../core/utils.js';
import { ic } from '../core/icons.js';
import { STATUSES } from '../core/constants.js';
import { D, SINGLE_USER, TM, isOver, mem, pColor, progressOf, task, tasksOf } from '../core/store.js';
import { av, avStack, empty, pStatus, pTypeBadge, stIcon } from '../ui/helpers.js';
import { sortTasks } from '../shell/view-engine.js';
import { actHtml, miniRow } from '../components/task-list.js';

export function projOverview(p) {
  const ts = tasksOf(p.id);
  const pr = progressOf(p.id);
  const cnt = STATUSES.map(s => ({ s, n: ts.filter(t => t.status === s.id).length }));
  const over = ts.filter(isOver);
  const soon = sortTasks(
    ts.filter(t => t.status !== 'done' && t.due),
    { f: 'due', dir: 1 },
  ).slice(0, 6);
  const acts = D()
    .activity.filter(a => a.project === p.id)
    .slice(0, 6);
  const daysLeft = p.due ? diffD(parse(p.due), TODAY) : null;
  const ms = (p.milestones || []).slice().sort((a, b) => ((a.date || '9999') > (b.date || '9999') ? 1 : -1));
  return `<div class="page" style="max-width:1160px;padding-top:22px">
    <div class="grid2">
      <div class="stack">
        <section class="panel"><div class="panel-h"><h2>Descripción</h2><div class="acts"><button class="btn btn-sm btn-ghost" data-a="editProject" data-id="${p.id}">${ic('pencil', 13)}Editar</button></div></div><div class="panel-b" style="font-size:14px;line-height:1.6;color:var(--text)">${esc(p.desc)}</div></section>
        <section class="panel"><div class="panel-h"><h2>Progreso</h2><div class="acts"><span class="faint" style="font-size:12px">${ts.filter(t => t.status === 'done').length} de ${ts.length} tareas completadas</span></div></div>
          <div class="panel-b">
            <div class="row" style="align-items:baseline;gap:10px;margin-bottom:10px"><span style="font-size:30px;font-weight:600;letter-spacing:-.03em" class="num">${pr}%</span>${daysLeft !== null ? `<span class="muted">${daysLeft >= 0 ? `Faltan ${daysLeft} días (${fmtDate(p.due)})` : `Finalizado el ${fmtDate(p.due)}`}</span>` : ''}${over.length ? `<span class="badge red">${ic('clock-alert', 11)}${over.length} vencida${over.length > 1 ? 's' : ''}</span>` : ''}</div>
            <div class="stackbar" style="height:8px;margin-bottom:12px">${cnt.map(c => `<i style="width:${(c.n / Math.max(ts.length, 1)) * 100}%;background:var(--st-${c.s.id})" title="${c.s.name}: ${c.n}"></i>`).join('')}</div>
            <div class="row" style="flex-wrap:wrap;gap:14px;font-size:12.5px">${cnt.map(c => `<button class="row" style="gap:5px" data-a="goFilteredList" data-id="${p.id}" data-st="${c.s.id}">${stIcon(c.s.id, 12)}<span class="muted">${c.s.name}</span><b class="num" style="font-weight:600">${c.n}</b></button>`).join('')}</div>
          </div></section>
        <section class="panel"><div class="panel-h"><h2>Próximas tareas</h2><div class="acts"><button class="btn btn-sm btn-ghost" data-a="go" data-r="project" data-id="${p.id}" data-tab="list">Ver lista</button></div></div>${soon.map(t => miniRow(t, { noProj: true })).join('') || empty('circle-check', 'Nada programado', 'Las tareas con fecha límite aparecerán aquí.', '', 'sm')}</section>
      </div>
      <div class="stack">
        <section class="panel"><div class="panel-h"><h2>Detalles</h2></div><div class="panel-b"><dl class="kv">
          <dt>${ic('layers', 14)}Tipo</dt><dd>${pTypeBadge(p.ptype)}</dd>
          <dt>${ic('circle-dot', 14)}Estado</dt><dd><button class="pillbtn" data-a="pop" data-pop="pstatus" data-id="${p.id}">${pStatus(p.status)}</button></dd>
          ${SINGLE_USER ? '' : `<dt>${ic('user', 14)}Responsable</dt><dd><span class="pillbtn">${av(p.lead, 'sm', false)}${esc(mem(p.lead)?.name)}</span></dd><dt>${ic('users', 14)}Equipo</dt><dd><button class="pillbtn" data-a="go" data-r="team" data-id="${p.team}">${ic(TM[p.team].icon, 13)}${TM[p.team].name}</button></dd>`}
          <dt>${ic('calendar', 14)}Inicio</dt><dd><button class="pillbtn num ${p.start ? '' : 'empty'}" data-a="pop" data-pop="pdate" data-field="start" data-id="${p.id}" aria-label="Editar fecha de inicio">${fmtDate(p.start, true) || 'Poner fecha'}</button></dd>
          <dt>${ic('flag', 14)}Fecha objetivo</dt><dd><button class="pillbtn num ${p.due ? '' : 'empty'}" data-a="pop" data-pop="pdate" data-field="due" data-id="${p.id}" aria-label="Editar fecha objetivo">${fmtDate(p.due, true) || 'Poner fecha'}</button></dd>
          ${SINGLE_USER ? '' : `<dt>${ic('user-plus', 14)}Miembros</dt><dd><button class="pillbtn" data-a="share" data-id="${p.id}">${avStack(p.members, 6)}<span class="faint">${p.members.length}</span></button></dd>`}
        </dl></div></section>
        <section class="panel"><div class="panel-h"><h2>Hitos</h2><div class="acts"><button class="btn btn-sm btn-ghost" data-a="newMilestone" data-id="${p.id}">${ic('plus', 13)}Añadir hito</button></div></div><div class="panel-b">${
          ms
            .map((m, idx) => {
              const origIdx = (p.milestones || []).indexOf(m);
              const done = !!m.done;
              const overMs = !done && m.date && diffD(parse(m.date), TODAY) < 0;
              return `<div class="row" style="min-height:34px;font-size:13px;gap:8px">
                <input type="checkbox" class="check round" ${done ? 'checked' : ''} data-a="toggleMilestone" data-id="${p.id}" data-i="${origIdx >= 0 ? origIdx : idx}" aria-label="Completar hito ${esc(m.name)}">
                <span style="width:8px;height:8px;transform:rotate(45deg);border-radius:2px;flex-shrink:0;background:${done ? 'var(--green)' : overMs ? 'var(--red)' : pColor(p)}"></span>
                <span class="grow trunc ${done ? 'faint' : ''}" style="${done ? 'text-decoration:line-through' : ''}">${esc(m.name)}</span>
                <span class="num ${overMs ? '' : 'muted'}" style="${overMs ? 'color:var(--red)' : ''}">${m.date ? fmtDate(m.date) : 'Sin fecha'}</span>
                <button class="ibtn ibtn-xs" data-a="editMilestone" data-id="${p.id}" data-i="${origIdx >= 0 ? origIdx : idx}" aria-label="Editar hito">${ic('pencil', 12)}</button>
                <button class="ibtn ibtn-xs" data-a="delMilestone" data-id="${p.id}" data-i="${origIdx >= 0 ? origIdx : idx}" aria-label="Eliminar hito">${ic('x', 12)}</button>
              </div>`;
            })
            .join('') || '<span class="faint" style="font-size:13px">Todavía no hay hitos. Añade los puntos clave de entrega.</span>'
        }</div></section>
        <section class="panel"><div class="panel-h"><h2>Actividad reciente</h2><div class="acts"><button class="btn btn-sm btn-ghost" data-a="go" data-r="project" data-id="${p.id}" data-tab="activity">Ver todo</button></div></div><div class="panel-b feed">${acts.map(a => actHtml(a)).join('') || '<span class="faint">Sin actividad todavía</span>'}</div></section>
      </div>
    </div>
  </div>`;
}
export function projActivity(p) {
  const as = D().activity.filter(a => a.project === p.id);
  const cs = D()
    .comments.filter(c => task(c.task)?.project === p.id)
    .map(c => ({ id: c.id, by: c.by, verb: 'añadió una nota en', task: c.task, project: p.id, at: c.at, extra: '' }));
  const all = [...as, ...cs].sort((a, b) => b.at - a.at);
  const b = {};
  all.forEach(a => (b[dayBucket(a.at)] ||= []).push(a));
  return `<div class="page" style="max-width:780px;padding-top:18px">${
    all.length
      ? Object.entries(b)
          .map(([k, list]) => `<div class="day-h">${k}</div><div class="feed lined">${list.map(a => actHtml(a)).join('')}</div>`)
          .join('')
      : empty('activity', 'Sin actividad todavía', 'Los cambios en este proyecto aparecerán aquí.')
  }</div>`;
}
