/* ---------- MY TASKS ---------- */
import { TODAY, dOff, diffD, parse } from '../core/utils.js';
import { ic } from '../core/icons.js';
import { D, S, SINGLE_USER, allTasks, isOver } from '../core/store.js';
import { applyView, viewOf, viewToolbar } from '../shell/view-engine.js';
import { listHtml } from '../components/task-list.js';
import { calendarHtml } from '../views/calendar.js';

export function pageMyTasks() {
  const key = 'mytasks';
  const v = viewOf(key);
  const mine = applyView(
    SINGLE_USER ? allTasks() : allTasks().filter(t => t.assignee === D().me),
    v.sort.f === 'manual' ? { ...v, sort: { f: 'due', dir: 1 } } : v,
  );
  const groups = [
    { key: 'overdue', name: 'Vencidas', html: `<span style="color:var(--red)">${ic('clock-alert', 14)}</span>`, tasks: mine.filter(isOver), set: {} },
    {
      key: 'today',
      name: 'Hoy',
      html: ic('sun', 14),
      tasks: mine.filter(t => t.status !== 'done' && t.due && diffD(parse(t.due), TODAY) === 0),
      set: { due: dOff(0) },
    },
    {
      key: 'upcoming',
      name: 'Próximas',
      html: ic('calendar-days', 14),
      tasks: mine.filter(t => t.status !== 'done' && (!t.due || diffD(parse(t.due), TODAY) > 0)),
      set: { due: dOff(3) },
    },
    {
      key: 'completed',
      name: 'Completadas',
      html: `<span style="color:var(--green)">${ic('circle-check', 14)}</span>`,
      tasks: mine.filter(t => t.status === 'done'),
      set: { status: 'done' },
      collapsed: true,
    },
  ];
  const mode = S.ui.myView;
  return `<div class="page flush">
    <div class="ph"><div><h1>Mis tareas</h1><p>${groups[1].tasks.length} para hoy · ${groups[0].tasks.length} vencidas · ${groups[2].tasks.length} próximas</p></div>
      <div class="acts"><div class="seg" role="tablist" aria-label="Vista">${[
        ['list', 'Lista', 'list'],
        ['calendar', 'Calendario', 'calendar'],
      ]
        .map(([k, n, i]) => `<button class="${mode === k ? 'on' : ''}" data-a="set" data-k="myView" data-v="${k}">${ic(i, 13)}${n}</button>`)
        .join('')}</div>
      <button class="btn btn-primary" data-a="newTask" data-assignee="${D().me}">${ic('plus', 14)}Nueva tarea</button></div></div>
    ${viewToolbar(key, { group: false })}
    ${mode === 'calendar' ? calendarHtml(mine, { key: 'my' }) : `<div class="list-wrap">${listHtml(groups, key, { cols: ['project', 'status', 'priority', 'due'], complete: true, drag: false, keepEmpty: true })}</div>`}
  </div>`;
}
