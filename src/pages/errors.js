/* ---------- 404 / DENIED / FAILED ---------- */
import { esc } from '../core/utils.js';
import { ic } from '../core/icons.js';
import { mem } from '../core/store.js';

export function page404() {
  return `<div class="fullstate"><div class="box"><div class="empty-state" style="padding:0"><div class="glyph">${ic('file-question', 20)}</div></div><span class="code">ERROR 404</span><h1>Página no encontrada</h1><p>La página que buscas fue movida, eliminada o no existe. Comprueba el enlace o vuelve al inicio.</p><div class="row"><button class="btn btn-secondary" data-a="back">${ic('arrow-left', 14)}Volver</button><button class="btn btn-primary" data-a="go" data-r="home">Ir a Inicio</button></div></div></div>`;
}
export function stateDenied(p) {
  const lead = mem(p?.lead);
  return `<div class="fullstate"><div class="box"><div class="empty-state" style="padding:0"><div class="glyph">${ic('lock', 20)}</div></div><span class="code">ERROR 403</span><h1>Sin acceso</h1><p>${p ? `<b>${esc(p.name)}</b> es un proyecto privado. ` : ''}Pide acceso a ${lead ? esc(lead.name) : 'su responsable'}.</p><div class="row"><button class="btn btn-secondary" data-a="go" data-r="projects">Volver a proyectos</button><button class="btn btn-primary" data-a="requestAccess" data-id="${p?.id || ''}">Solicitar acceso</button></div></div></div>`;
}
export function stateFailed() {
  return `<div class="fullstate"><div class="box"><div class="empty-state err" style="padding:0"><div class="glyph">${ic('cloud-alert', 20)}</div></div><h1>Algo ha fallado</h1><p>No se pudo cargar esta página. Tus datos están a salvo; inténtalo de nuevo.</p><div class="row"><button class="btn btn-secondary" data-a="go" data-r="home">Ir a Inicio</button><button class="btn btn-primary" data-a="reload">${ic('refresh-cw', 14)}Reintentar</button></div></div></div>`;
}
