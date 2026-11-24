/* ---------------- CONTEXT MENUS ---------------- */
import { ic } from '../core/icons.js';
import { ST } from '../core/constants.js';
import { D, SINGLE_USER, mem, proj, task, visibleProjects } from '../core/store.js';

export function ctxMenu(p) {
  const I = (act, icon, label, extra = '', r = '') =>
    `<button class="mi ${extra}" data-a="${act}" data-id="${p.id}" data-key="${p.key || ''}">${ic(icon, 15)}${label}${r ? `<span class="r">${r}</span>` : ''}</button>`;
  const sep = '<div class="msep"></div>';
  if (p.ctx === 'task') {
    const t = task(p.id);
    if (!t) return '';
    return (
      I('openTask', 'panel-right-open', 'Abrir') +
      I('editTask', 'pencil', 'Editar', '', 'E') +
      I('toggleDone', t.status === 'done' ? 'rotate-ccw' : 'circle-check', t.status === 'done' ? 'Reabrir' : 'Marcar como hecha') +
      sep +
      I('ctxStatus', 'circle-dot', 'Estado…') +
      (SINGLE_USER ? '' : I('ctxAssign', 'user', 'Asignar a…')) +
      I('ctxPrio', 'signal-high', 'Prioridad…') +
      I('ctxMove', 'folder-input', 'Mover a proyecto…') +
      sep +
      I('toggleFavTask', 'star', t.fav ? 'Quitar de favoritos' : 'Añadir a favoritos') +
      I('copyLink', 'link', 'Copiar enlace') +
      I('dupTask', 'copy', 'Duplicar') +
      I('archiveTask', 'archive', 'Archivar') +
      sep +
      I('delTask', 'trash-2', 'Eliminar', 'danger', 'Supr')
    );
  }
  if (p.ctx === 'project') {
    const pr = proj(p.id);
    if (!pr) return '';
    return (
      I('openProject', 'arrow-up-right', 'Abrir') +
      I('toggleFavProj', 'star', pr.fav ? 'Quitar de favoritos' : 'Añadir a favoritos') +
      I('editProject', 'pencil', 'Renombrar y editar') +
      (SINGLE_USER ? '' : I('share', 'share-2', 'Compartir')) +
      I('copyLink', 'link', 'Copiar enlace') +
      I('dupProject', 'copy', 'Duplicar') +
      sep +
      (visibleProjects().indexOf(pr) > 0 ? I('projUp', 'arrow-up', 'Subir en la barra lateral') : '') +
      (visibleProjects().indexOf(pr) < visibleProjects().length - 1 ? I('projDown', 'arrow-down', 'Bajar en la barra lateral') : '') +
      sep +
      I('archiveProject', 'archive', 'Archivar proyecto') +
      I('delProject', 'trash-2', 'Eliminar proyecto', 'danger')
    );
  }
  if (p.ctx === 'column') {
    return (
      `<div class="mh">${ST[p.id].name}</div>` +
      I('colAdd', 'plus', 'Añadir tarea') +
      I('colCollapse', 'fold-horizontal', 'Contraer columna') +
      (p.id !== 'done' ? I('colDoneAll', 'check-check', 'Marcar todas como hechas') : I('colArchive', 'archive', 'Archivar completadas')) +
      I('colSortPrio', 'arrow-down-wide-narrow', 'Ordenar por prioridad')
    );
  }
  if (p.ctx === 'member') {
    const m = mem(p.id);
    if (!m) return '';
    const canRm = m.role !== 'Owner' && m.id !== D().me;
    return (
      I('viewProfile', 'user', 'Ver perfil') +
      I('assignToMember', 'plus', 'Asignar tarea') +
      I('copyEmail', 'mail', 'Copiar correo') +
      (canRm
        ? I('ctxRole', 'shield', 'Cambiar rol…') +
          (m.status === 'invited' ? I('resendInvite', 'send', 'Reenviar invitación') : '') +
          sep +
          I('removeMember', 'user-minus', 'Quitar del espacio', 'danger')
        : '')
    );
  }
  if (p.ctx === 'file') {
    return (
      I('previewFile', 'eye', 'Vista previa') +
      I('renameFile', 'pencil', 'Renombrar') +
      I('copyLink', 'link', 'Copiar enlace') +
      I('dupFile', 'copy', 'Duplicar') +
      sep +
      I('delFile', 'trash-2', 'Eliminar', 'danger')
    );
  }
  if (p.ctx === 'savedview') {
    return `<button class="mi" data-a="renameView" data-id="${p.vid}">${ic('pencil', 15)}Renombrar vista</button><button class="mi danger" data-a="delView" data-id="${p.vid}">${ic('trash-2', 15)}Eliminar vista</button>`;
  }
  return '';
}
