/* ---------- WORKSPACE TASKS ---------- */
import { ic } from '../core/icons.js';
import { SINGLE_USER, allTasks, canSee, visibleProjects } from '../core/store.js';
import { applyView, groupTasks, viewOf, viewToolbar } from '../shell/view-engine.js';
import { listHtml } from '../components/task-list.js';
import { boardHtml } from '../views/board.js';
import { tableHtml } from '../views/table.js';

export function pageTasks() {
  const key = 'tasks';
  const v = viewOf(key);
  v.mode = v.mode || 'list';
  const ts = applyView(allTasks(), v);
  const right = `<div class="seg">${[
    ['list', 'Lista', 'list'],
    ['board', 'Tablero', 'square-kanban'],
    ['table', 'Tabla', 'table-2'],
  ]
    .map(
      ([k, n, i]) =>
        `<button class="${v.mode === k ? 'on' : ''}" data-a="setViewMode" data-key="${key}" data-v="${k}">${ic(i, 13)}<span class="hide-m">${n}</span></button>`,
    )
    .join('')}</div>`;
  let body;
  if (v.mode === 'board') body = boardHtml(ts, key, {});
  else if (v.mode === 'table') body = tableHtml(ts, key);
  else
    body = `<div class="list-wrap">${listHtml(groupTasks(ts, v.group), key, {
      cols: SINGLE_USER ? ['status', 'priority', 'due', 'labels', 'project'] : ['status', 'assignee', 'priority', 'due', 'project'],
    })}</div>`;
  return `<div class="page flush">
    <div class="ph"><div><h1>Tareas</h1><p>Todas las tareas en ${visibleProjects().filter(canSee).length} proyectos.</p></div><div class="acts"><button class="btn btn-primary" data-a="newTask">${ic('plus', 14)}Nueva tarea</button></div></div>
    ${viewToolbar(key, { right, cols: v.mode === 'table', group: v.mode !== 'board' })}
    ${body}
  </div>`;
}
