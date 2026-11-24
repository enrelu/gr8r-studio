/* ---------- ACTIVITY ---------- */
import { dayBucket, esc } from '../core/utils.js';
import { D, S, SINGLE_USER, canSee, proj } from '../core/store.js';
import { empty } from '../ui/helpers.js';
import { actHtml } from '../components/task-list.js';

export function pageActivity() {
  const f = S.ui.actFilter || 'all';
  const who = S.ui.actWho || 'all';
  let as = D().activity.filter(a => !a.project || canSee(proj(a.project)));
  if (f !== 'all')
    as = as.filter(a =>
      f === 'comments'
        ? /coment|nota|comment/i.test(a.verb)
        : f === 'status'
          ? /movi|complet|reabri|moved|completed|reopened/i.test(a.verb)
          : f === 'projects'
            ? /proyecto|project|hito/i.test(a.verb)
            : true,
    );
  if (!SINGLE_USER && who !== 'all') as = as.filter(a => a.by === who);
  const b = {};
  as.forEach(a => (b[dayBucket(a.at)] ||= []).push(a));
  return `<div class="page" style="max-width:820px">
    <div class="ph"><div><h1>Actividad</h1><p>Historial de cambios en todos los proyectos.</p></div></div>
    <div class="row" style="gap:8px;margin-bottom:6px;flex-wrap:wrap"><div class="seg">${[
      ['all', 'Todo'],
      ['status', 'Cambios de estado'],
      ['comments', 'Notas'],
      ['projects', 'Proyectos e hitos'],
    ]
      .map(([k, n]) => `<button class="${f === k ? 'on' : ''}" data-a="set" data-k="actFilter" data-v="${k}">${n}</button>`)
      .join('')}</div>
    ${
      SINGLE_USER
        ? ''
        : `<select class="select" style="height:26px;width:auto;font-size:12px" data-in="actWho" aria-label="Filtrar por persona"><option value="all">Todos</option>${D()
            .members.map(m => `<option value="${m.id}" ${who === m.id ? 'selected' : ''}>${esc(m.name)}</option>`)
            .join('')}</select>`
    }</div>
    ${
      as.length
        ? Object.entries(b)
            .map(([k, list]) => `<div class="day-h">${k}</div><div class="feed lined">${list.map(a => actHtml(a, { proj: true })).join('')}</div>`)
            .join('')
        : empty('activity', 'Sin actividad todavía', 'Los cambios en tareas y proyectos aparecerán aquí.')
    }
  </div>`;
}
