/* ---------- FAVORITES ---------- */
import { allTasks, canSee, visibleProjects } from '../core/store.js';
import { empty } from '../ui/helpers.js';
import { miniRow } from '../components/task-list.js';
import { projectCard } from './projects.js';

export function pageFavorites() {
  const ps = visibleProjects().filter(p => p.fav && canSee(p));
  const ts = allTasks().filter(t => t.fav);
  return `<div class="page wide">
    <div class="ph"><div><h1>Favoritos</h1><p>Proyectos y tareas fijados para acceso rápido.</p></div></div>
    ${
      !ps.length && !ts.length
        ? `<div class="panel">${empty('star', 'Sin favoritos todavía', 'Marca un proyecto o tarea con estrella para fijarlo aquí.', `<button class="btn btn-secondary btn-sm" data-a="go" data-r="projects">Explorar proyectos</button>`)}</div>`
        : `
    <h2 class="sec" style="margin-bottom:10px">Proyectos <span class="faint" style="font-weight:500">${ps.length}</span></h2>
    ${ps.length ? `<div class="pgrid" style="margin-bottom:28px">${ps.map(projectCard).join('')}</div>` : '<p class="faint" style="margin-bottom:28px">No hay proyectos favoritos.</p>'}
    <h2 class="sec" style="margin-bottom:6px">Tareas <span class="faint" style="font-weight:500">${ts.length}</span></h2>
    ${ts.length ? `<div class="panel" style="overflow:hidden">${ts.map(t => miniRow(t)).join('')}</div>` : '<p class="faint">Abre una tarea y pulsa la estrella para añadirla aquí.</p>'}`
    }
  </div>`;
}
