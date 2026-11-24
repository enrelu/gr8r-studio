/* ---------------- MODALS ---------------- */
import { $$, MOD, ago, esc, fmtDate } from '../core/utils.js';
import { ic } from '../core/icons.js';
import { PCOLORS, PICONS, PTYPES } from '../core/constants.js';
import { D, S, SINGLE_USER, mem, pColor, proj, task, teamsList } from '../core/store.js';
import { FT, av, filePrev, lbl, prPill, stPill } from '../ui/helpers.js';
import { focusKey, render } from '../shell/render.js';
import { teamModal } from '../features/teams.js';

export function openModal(m) {
  S.ui.modalOpeners = S.ui.modalOpeners || [];
  S.ui.modalOpeners[S.ui.modals.length] = S.ui.popOpener && S.ui.pop ? S.ui.popOpener : focusKey(document.activeElement);
  S.ui.modals.push(m);
  S.ui.pop = null;
  render();
  setTimeout(() => {
    const all = $$('.modal');
    const last = all[all.length - 1];
    const af = last?.querySelector('[autofocus]');
    (af || last?.querySelector('input,textarea,button'))?.focus();
  }, 30);
}
export function closeModal() {
  S.ui.modals.pop();
  S.ui.pop = null;
  render();
}
export function modalHtml(m) {
  const H = (title, sub = '') =>
    `<div class="modal-h"><div><h2 id="mt-${m.type}">${title}</h2>${sub ? `<div class="muted" style="font-size:12.5px;margin-top:2px">${sub}</div>` : ''}</div><button class="ibtn ibtn-sm" data-a="closeModal" aria-label="Cerrar">${ic('x', 16)}</button></div>`;
  const wrap = (cls, inner) => `<div class="modal ${cls}" role="dialog" aria-modal="true" aria-labelledby="mt-${m.type}">${inner}</div>`;
  switch (m.type) {
    case 'task':
      return wrap('', taskModal(m, H));
    case 'project':
      return wrap('', projectModal(m, H));
    case 'milestone':
      return wrap('sm', milestoneModal(m, H));
    case 'share':
      return wrap('', shareModal(m, H));
    case 'invite':
      return wrap('', inviteModal(m, H));
    case 'confirm':
      return wrap('sm', confirmModal(m, H));
    case 'prompt':
      return wrap(
        'sm',
        `${H(m.title)}<form class="modal-b" data-submit="promptSubmit"><div class="field"><label class="label" for="prompt-in">${esc(m.label)}</label><input class="input" id="prompt-in" value="${esc(m.value || '')}" autofocus></div></form><div class="modal-f"><span class="sp"></span><button class="btn btn-secondary" data-a="closeModal">Cancelar</button><button class="btn btn-primary" data-a="promptSubmit">${esc(m.ok || 'Guardar')}</button></div>`,
      );
    case 'shortcuts':
      return wrap('lg', shortcutsModal(H));
    case 'team':
      return wrap('', teamModal(m, H));
    case 'filePreview':
      return wrap('lg', filePreviewModal(m, H));
    case 'saveView':
      return wrap(
        'sm',
        `${H('Guardar vista', 'Guarda los filtros actuales como una pestaña en este proyecto.')}<form class="modal-b" data-submit="saveViewSubmit"><div class="field"><label class="label" for="sv-name">Nombre de la vista</label><input class="input" id="sv-name" placeholder="ej. Pendientes de revisión" autofocus></div><div class="field"><label class="label" for="sv-type">Formato</label><select class="select" id="sv-type"><option value="list">Lista</option><option value="board">Tablero</option><option value="table">Tabla</option></select></div>${m.nf ? `<div class="hint">Se guardarán ${m.nf} filtro${m.nf > 1 ? 's' : ''} en esta vista.</div>` : '<div class="alert info">' + ic('info', 14) + '<span>No hay filtros activos: la vista mostrará todas las tareas.</span></div>'}</form><div class="modal-f"><span class="sp"></span><button class="btn btn-secondary" data-a="closeModal">Cancelar</button><button class="btn btn-primary" data-a="saveViewSubmit">Guardar vista</button></div>`,
      );
  }
  return '';
}
export function formChip(pop, html, label) {
  return `<button class="pillbtn bordered" data-a="pop" data-pop="${pop}" data-id="__form" ${pop === 'date' ? `data-field="${label}"` : ''} aria-label="${esc(label)}">${html}</button>`;
}
export function taskModal(m, H) {
  const f = S.ui.form;
  const p = proj(f.project);
  const err = S.ui.errors.title;
  return `${H(m.edit ? 'Editar tarea' : 'Nueva tarea', m.edit ? `<span class="mono">${task(m.edit)?.key}</span>` : '')}
  <form class="modal-b" data-submit="submitTask" style="gap:12px">
    <div class="field"><label class="sr" for="f-title">Nombre de la tarea</label><input class="input input-lg ${err ? 'is-error' : ''}" id="f-title" data-in="form" data-f="title" value="${esc(f.title)}" placeholder="Nombre de la tarea" autofocus aria-invalid="${!!err}" aria-describedby="f-title-err" style="font-size:15px;font-weight:500">${err ? `<span class="err" id="f-title-err">${ic('circle-alert', 12)}${err}</span>` : ''}</div>
    <div class="field"><label class="sr" for="f-desc">Descripción</label><textarea class="textarea" id="f-desc" data-in="form" data-f="desc" placeholder="Añade una descripción… (opcional)" rows="3">${esc(f.desc)}</textarea></div>
    <div class="row" style="flex-wrap:wrap;gap:6px">
      ${formChip('project', `<span class="pdot" style="--c:${pColor(p)}"></span>${esc(p?.name || 'Proyecto')}`, 'Proyecto')}
      ${formChip('status', stPill(f.status), 'Estado')}
      ${SINGLE_USER ? '' : formChip('assignee', `${av(f.assignee, 'sm', false)}${esc(mem(f.assignee)?.name || 'Responsable')}`, 'Responsable')}
      ${formChip('priority', prPill(f.priority), 'Prioridad')}
      ${formChip('date', `${ic('calendar', 13)}${f.due ? 'Límite ' + fmtDate(f.due) : 'Fecha límite'}`, 'due')}
      ${formChip('date', `${ic('calendar-arrow-up', 13)}${f.start ? 'Inicio ' + fmtDate(f.start) : 'Fecha inicio'}`, 'start')}
      ${formChip('labels', f.labels.length ? f.labels.map(lbl).join('') : `${ic('tag', 13)}Etiquetas`, 'Etiquetas')}
      ${formChip('recur', `${ic('repeat', 13)}${f.recur || 'Repetición'}`, 'Repetición')}
    </div>
    <div class="field"><span class="label">Subtareas</span>
      ${f.subtasks.map((s, i) => `<div class="subt" style="padding:0 4px">${ic('circle', 13)}<span class="s">${esc(s.title)}</span><button type="button" class="ibtn ibtn-xs x" style="opacity:1" data-a="formRmSub" data-i="${i}" aria-label="Quitar">${ic('x', 12)}</button></div>`).join('')}
      <div class="inwrap">${ic('plus', 14)}<input class="input" id="f-sub" data-key-enter="formAddSub" placeholder="Añade una subtarea y pulsa Enter"></div></div>
    ${
      SINGLE_USER
        ? ''
        : `<div class="field"><span class="label">Adjuntos</span>
      ${f.files.length ? `<div class="col" style="gap:4px">${f.files.map((x, i) => `<div class="upl" style="padding:6px 10px"><span class="ftype" style="--c:${FT[x.type].c};width:22px;height:22px">${ic(FT[x.type].i, 12)}</span><span class="grow trunc">${esc(x.name)}</span><span class="faint" style="font-size:11.5px">${x.size}</span><button type="button" class="ibtn ibtn-xs" data-a="formRmFile" data-i="${i}" aria-label="Quitar">${ic('x', 12)}</button></div>`).join('')}</div>` : ''}
      <label class="dropzone" style="padding:10px">${ic('paperclip', 14)}<span>Adjuntar archivos</span><input type="file" multiple hidden data-in="formFiles"></label></div>`
    }
  </form>
  <div class="modal-f">${m.edit ? '' : `<label class="row" style="gap:8px;font-size:12.5px;color:var(--text-2);cursor:pointer"><input type="checkbox" class="toggle" id="f-more" data-in="formMore" ${f.more ? 'checked' : ''}>Crear más</label>`}<span class="sp"></span>
    <span class="faint hide-m" style="font-size:11.5px"><kbd>${MOD}</kbd> <kbd>↵</kbd></span>
    <button class="btn btn-secondary" data-a="closeModal">Cancelar</button><button class="btn btn-primary" data-a="submitTask" id="f-submit">${m.edit ? 'Guardar cambios' : 'Crear tarea'}</button></div>`;
}
export const TEMPLATES = [
  { id: 'blank', name: 'Proyecto en blanco', icon: 'file', ptype: 'software', desc: 'Empieza desde cero', tasks: [], milestones: [] },
  {
    id: 'software',
    name: 'Desarrollo SW',
    icon: 'code',
    ptype: 'software',
    desc: 'Spec, código, QA y release',
    tasks: [
      'Definir alcance y requisitos técnicos',
      'Configurar repositorio, entorno y CI',
      'Implementar modelo de datos y lógica core',
      'Desarrollar interfaz y pruebas',
      'Revisión y despliegue v1.0',
    ],
    milestones: [
      { name: 'Arquitectura y entorno listos', offset: 5 },
      { name: 'MVP funcional', offset: 15 },
      { name: 'Release v1.0', offset: 25 },
    ],
  },
  {
    id: 'cyber',
    name: 'Auditoría / Pentest',
    icon: 'shield',
    ptype: 'cyber',
    desc: 'Alcance, pruebas, informe y retest',
    tasks: [
      'Kick-off y validación de alcance',
      'Reconocimiento y enumeración de activos',
      'Ejecución de pruebas técnicas y análisis',
      'Redacción de informe técnico y ejecutivo',
      'Presentación y retest de remediaciones',
    ],
    milestones: [
      { name: 'Alcance validado', offset: 2 },
      { name: 'Fin de pruebas técnicas', offset: 10 },
      { name: 'Entrega de informe', offset: 15 },
      { name: 'Retest y cierre', offset: 21 },
    ],
  },
  {
    id: 'hardening',
    name: 'Servicio Ciberseguridad',
    icon: 'lock',
    ptype: 'cyber',
    desc: 'Diagnóstico, hardening y seguimiento',
    tasks: [
      'Inventario de activos y revisión de línea base',
      'Evaluación de controles y configuraciones',
      'Plan de hardening y mitigación',
      'Validación de cambios aplicados',
    ],
    milestones: [
      { name: 'Diagnóstico inicial', offset: 4 },
      { name: 'Plan de hardening aprobado', offset: 10 },
      { name: 'Cierre de servicio', offset: 18 },
    ],
  },
];
export function projectModal(m, H) {
  const f = S.ui.pform;
  const err = S.ui.errors.pname;
  return `${H(m.edit ? 'Ajustes del proyecto' : 'Nuevo proyecto', m.edit ? '' : 'Organiza tareas, hitos y seguimiento de un proyecto o servicio.')}
  <form class="modal-b" data-submit="submitProject">
    <div class="row" style="gap:10px;align-items:flex-start">
      <button type="button" class="picon lg" style="--c:${PCOLORS[f.color]};cursor:default;flex-shrink:0;margin-top:22px" aria-hidden="true" tabindex="-1">${ic(f.icon, 18)}</button>
      <div class="field grow"><label class="label" for="p-name">Nombre del proyecto</label><input class="input ${err ? 'is-error' : ''}" id="p-name" data-in="pform" data-f="name" value="${esc(f.name)}" placeholder="ej. Portal de clientes o Auditoría Q4" autofocus aria-invalid="${!!err}">${err ? `<span class="err">${ic('circle-alert', 12)}${err}</span>` : ''}</div>
    </div>
    <div class="field"><label class="label" for="p-desc">Descripción</label><textarea class="textarea" id="p-desc" data-in="pform" data-f="desc" rows="2" placeholder="¿Cuál es el objetivo o alcance de este proyecto?">${esc(f.desc)}</textarea></div>
    <div class="row" style="gap:16px;align-items:flex-start;flex-wrap:wrap">
      <div class="field" style="flex:1;min-width:220px"><span class="label">Icono</span><div class="iconpick" role="radiogroup" aria-label="Icono">${PICONS.map(i => `<button type="button" role="radio" aria-checked="${f.icon === i}" class="${f.icon === i ? 'on' : ''}" data-a="pformSet" data-f="icon" data-v="${i}" aria-label="${i}">${ic(i, 15)}</button>`).join('')}</div></div>
      <div class="field"><span class="label">Color</span><div class="swatches" role="radiogroup" aria-label="Color" style="max-width:140px">${Object.entries(
        PCOLORS,
      )
        .map(
          ([k, v]) =>
            `<button type="button" role="radio" aria-checked="${f.color === k}" class="sw ${f.color === k ? 'on' : ''}" style="--c:${v};width:22px;height:22px" data-a="pformSet" data-f="color" data-v="${k}" aria-label="${k}">${f.color === k ? ic('check', 12) : ''}</button>`,
        )
        .join('')}</div></div>
    </div>
    <div class="row" style="gap:12px;flex-wrap:wrap">
      <div class="field" style="flex:1;min-width:170px"><label class="label" for="p-ptype">Tipo de proyecto</label><select class="select" id="p-ptype" data-in="pform" data-f="ptype">${Object.values(
        PTYPES,
      )
        .map(pt => `<option value="${pt.id}" ${(f.ptype || 'software') === pt.id ? 'selected' : ''}>${pt.name}</option>`)
        .join('')}</select></div>
      ${
        SINGLE_USER
          ? ''
          : `<div class="field" style="flex:1;min-width:150px"><label class="label" for="p-team">Equipo</label><select class="select" id="p-team" data-in="pform" data-f="team">${teamsList()
              .map(t => `<option value="${t.id}" ${f.team === t.id ? 'selected' : ''}>${t.name}</option>`)
              .join('')}</select></div>
      <div class="field" style="flex:1;min-width:150px"><label class="label" for="p-lead">Responsable</label><select class="select" id="p-lead" data-in="pform" data-f="lead">${D()
        .members.filter(x => x.status === 'active')
        .map(x => `<option value="${x.id}" ${f.lead === x.id ? 'selected' : ''}>${esc(x.name)}</option>`)
        .join('')}</select></div>`
      }
      <div class="field" style="flex:1;min-width:150px"><label class="label" for="p-due">Fecha objetivo</label><input type="date" class="input" id="p-due" data-in="pform" data-f="due" value="${f.due || ''}"></div>
    </div>
    ${m.edit ? '' : `<div class="field"><span class="label">Plantilla</span><div class="tmpls" role="radiogroup">${TEMPLATES.map(t => `<button type="button" role="radio" aria-checked="${f.tmpl === t.id}" class="opt ${f.tmpl === t.id ? 'on' : ''}" data-a="pformSet" data-f="tmpl" data-v="${t.id}" style="padding:10px">${ic(t.icon, 16)}<b style="font-size:12.5px">${t.name}</b><span>${t.tasks.length ? `${t.tasks.length} tareas · ${t.milestones.length} hitos` : t.desc}</span></button>`).join('')}</div></div>`}
  </form>
  <div class="modal-f"><span class="sp"></span><button class="btn btn-secondary" data-a="closeModal">Cancelar</button><button class="btn btn-primary" data-a="submitProject">${m.edit ? 'Guardar cambios' : 'Crear proyecto'}</button></div>`;
}
export function milestoneModal(m, H) {
  const f = S.ui.msform || { name: '', date: '' };
  const err = S.ui.errors.msname;
  return `${H(m.edit != null ? 'Editar hito' : 'Nuevo hito', esc(proj(m.id)?.name || ''))}
  <form class="modal-b" data-submit="submitMilestone">
    <div class="field"><label class="label" for="ms-name">Nombre del hito</label><input class="input ${err ? 'is-error' : ''}" id="ms-name" data-in="msform" data-f="name" value="${esc(f.name || '')}" placeholder="ej. Entrega de informe / MVP listo" autofocus>${err ? `<span class="err">${ic('circle-alert', 12)}${err}</span>` : ''}</div>
    <div class="field"><label class="label" for="ms-date">Fecha</label><input type="date" class="input" id="ms-date" data-in="msform" data-f="date" value="${esc(f.date || '')}"></div>
  </form>
  <div class="modal-f"><span class="sp"></span><button class="btn btn-secondary" data-a="closeModal">Cancelar</button><button class="btn btn-primary" data-a="submitMilestone">${m.edit != null ? 'Guardar hito' : 'Añadir hito'}</button></div>`;
}
export const PERMS = ['Puede ver', 'Puede comentar', 'Puede editar', 'Acceso total'];
export function shareModal(m, H) {
  const p = proj(m.id);
  p.perms = p.perms || {};
  p.access = p.access || 'workspace';
  return `${H(`Compartir “${esc(p.name)}”`)}
  <div class="modal-b">
    <form class="row" style="gap:6px" data-submit="shareInvite"><div class="grow"><label class="sr" for="share-in">Invitar por correo</label><input class="input" id="share-in" placeholder="Añadir por nombre o correo" value="${esc(S.ui.shareQ || '')}" data-in="shareQ" autofocus></div>
      <select class="select" id="share-perm" style="width:132px" aria-label="Permiso">${PERMS.map(x => `<option ${x === 'Puede editar' ? 'selected' : ''}>${x}</option>`).join('')}</select>
      <button class="btn btn-primary" data-a="shareInvite" type="button">Invitar</button></form>
    ${
      S.ui.shareQ
        ? `<div class="panel" style="padding:4px">${
            D()
              .members.filter(
                x => !p.members.includes(x.id) && (x.name.toLowerCase().includes(S.ui.shareQ.toLowerCase()) || x.email.includes(S.ui.shareQ.toLowerCase())),
              )
              .map(
                x =>
                  `<button class="mi" data-a="shareAdd" data-id="${p.id}" data-mid="${x.id}">${av(x.id, 'sm', false)}${esc(x.name)}<span class="r">${esc(x.email)}</span></button>`,
              )
              .join('') ||
            `<div class="mi faint" style="cursor:default">${S.ui.shareQ.includes('@') ? `Pulsa Invitar para enviar una invitación a ${esc(S.ui.shareQ)}` : 'Sin coincidencias'}</div>`
          }</div>`
        : ''
    }
    <div><div class="eyebrow" style="margin-bottom:4px">Personas con acceso</div>
      ${p.members
        .map(id => {
          const x = mem(id);
          if (!x) return '';
          const perm = id === p.lead ? 'Acceso total' : p.perms[id] || (x.role === 'Guest' ? 'Puede comentar' : 'Puede editar');
          return `<div class="row" style="height:44px">${av(id, 'md', false)}<div class="grow"><div style="font-weight:500;font-size:13px">${esc(x.name)}${id === D().me ? ' <span class="faint" style="font-weight:400">(tú)</span>' : ''}</div><div class="faint" style="font-size:11.5px">${esc(x.email)}${id === p.lead ? ' · Responsable' : ''}</div></div>
          ${id === p.lead ? `<span class="muted" style="font-size:12.5px;padding-right:8px">Acceso total</span>` : `<select class="select" style="width:auto;height:26px;font-size:12px;border-color:transparent;background-color:transparent" data-in="sharePerm" data-id="${p.id}" data-mid="${id}" aria-label="Permiso">${PERMS.map(q => `<option ${q === perm ? 'selected' : ''}>${q}</option>`).join('')}<option value="__remove">Quitar acceso</option></select>`}</div>`;
        })
        .join('')}
    </div>
  </div>
  <div class="modal-f"><button class="btn btn-secondary" data-a="copyLink" data-pid="${p.id}">${ic('link', 14)}Copiar enlace</button><span class="sp"></span><button class="btn btn-primary" data-a="closeModal">Listo</button></div>`;
}
export function inviteModal(m, H) {
  const err = S.ui.errors.invite;
  return `${H('Invitar a ' + esc(D().ws.name), 'Las personas invitadas recibirán un enlace para unirse.')}
  <form class="modal-b" data-submit="submitInvite">
    <div class="field"><label class="label" for="inv-emails">Correos electrónicos</label><textarea class="textarea ${err ? 'is-error' : ''}" id="inv-emails" placeholder="nombre@empresa.com" rows="3" autofocus>${esc(S.ui.inviteDraft || '')}</textarea>${err ? `<span class="err">${ic('circle-alert', 12)}${err}</span>` : '<span class="hint">Separa varias direcciones con comas.</span>'}</div>
    <div class="row" style="gap:12px"><div class="field grow"><label class="label" for="inv-role">Rol</label><select class="select" id="inv-role">${['Member', 'Admin', 'Guest'].map(r => `<option>${r}</option>`).join('')}</select></div>
    <div class="field grow"><label class="label" for="inv-team">Equipo</label><select class="select" id="inv-team">${teamsList()
      .map(t => `<option value="${t.id}">${t.name}</option>`)
      .join('')}</select></div></div>
  </form>
  <div class="modal-f"><button class="btn btn-ghost" data-a="copyInviteLink">${ic('link', 14)}Copiar enlace</button><span class="sp"></span><button class="btn btn-secondary" data-a="closeModal">Cancelar</button><button class="btn btn-primary" data-a="submitInvite" id="inv-submit">Enviar invitaciones</button></div>`;
}
export function confirmModal(m) {
  const needs = m.typeName;
  const ok = !needs || (S.ui.confirmText || '') === needs;
  return `<div class="modal-b" style="padding-top:18px;gap:10px">
    <div class="row" style="gap:12px;align-items:flex-start"><span class="ftype" style="--c:${m.danger ? 'var(--red)' : 'var(--amber)'};width:34px;height:34px;border-radius:9px">${ic(m.icon || (m.danger ? 'trash-2' : 'archive'), 17)}</span>
    <div class="grow"><h2 id="mt-confirm" style="font-size:15px;font-weight:600;margin:4px 0 6px">${esc(m.title)}</h2><p class="muted" style="margin:0;font-size:13px;line-height:1.55">${m.body}</p></div></div>
    ${needs ? `<div class="field" style="margin-top:6px"><label class="label" for="confirm-in" style="font-weight:400;color:var(--text-2)">Escribe <b style="color:var(--text);font-weight:600">${esc(needs)}</b> para confirmar</label><input class="input" id="confirm-in" data-in="confirmText" autocomplete="off" autofocus value="${esc(S.ui.confirmText || '')}"></div>` : ''}
  </div>
  <div class="modal-f"><span class="sp"></span><button class="btn btn-secondary" data-a="closeModal" ${needs ? '' : 'autofocus'}>Cancelar</button><button class="btn ${m.danger ? 'btn-danger' : 'btn-primary'}" data-a="confirmOk" ${ok ? '' : 'disabled'}>${esc(m.ok)}</button></div>`;
}
export const SHORTCUTS = [
  [
    'General',
    [
      ['Menú de comandos', [MOD, 'K']],
      ['Buscar', ['/']],
      ['Atajos de teclado', ['?']],
      ['Mostrar/ocultar barra lateral', ['[']],
      ['Cambiar tema claro/oscuro', [MOD, 'Shift', 'L']],
      ['Cerrar panel o diálogo', ['Esc']],
    ],
  ],
  [
    'Crear',
    [
      ['Nueva tarea', ['N']],
      ['Nuevo proyecto', ['P']],
      ['Guardar formulario', [MOD, '↵']],
      ['Guardar nota', [MOD, '↵']],
    ],
  ],
  [
    'Navegación',
    [
      ['Ir a Inicio', ['G', 'H']],
      ['Ir a Mis tareas', ['G', 'T']],
      ['Ir a Proyectos', ['G', 'P']],
      ...(SINGLE_USER ? [] : [['Ir a Bandeja', ['G', 'I']]]),
      ['Ir a Calendario', ['G', 'C']],
      ['Ir a Ajustes', ['G', 'S']],
    ],
  ],
  [
    'Menú de comandos',
    [
      ['Mover selección', ['↑', '↓']],
      ['Ejecutar comando', ['↵']],
      ['Modo búsqueda', ['Tab']],
    ],
  ],
];
export function shortcutsModal(H) {
  return `${H('Atajos de teclado')}<div class="modal-b" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:22px">${SHORTCUTS.map(([g, list]) => `<div><div class="eyebrow" style="margin-bottom:6px">${g}</div>${list.map(([n, k]) => `<div class="row" style="height:30px;font-size:13px;border-bottom:1px solid var(--divider)"><span class="grow">${n}</span>${k.map((x, i) => `${i && k[0] === 'G' ? '<span class="faint" style="font-size:11px">luego</span>' : ''}<kbd>${x}</kbd>`).join('')}</div>`).join('')}</div>`).join('')}</div>`;
}
export function filePreviewModal(m, H) {
  const f = m.file;
  const t = FT[f.type] || FT.other;
  return `${H(esc(f.name), `${t.n} · ${f.size} · Subido por ${esc(mem(f.by)?.name || 'ti')} ${ago(f.at)}`)}
  <div class="modal-b"><div style="border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden">${filePrev(f).replace('class="fprev"', 'class="fprev" style="aspect-ratio:16/9"')}</div>
  ${m.tid ? `<div class="row faint" style="font-size:12.5px">${ic('link', 13)}Adjunto en <button class="link" data-a="openTask" data-id="${m.tid}">${esc(task(m.tid)?.title)}</button></div>` : ''}</div>
  <div class="modal-f"><button class="btn btn-secondary" data-a="copyLink" data-fid="${f.id}">${ic('link', 14)}Copiar enlace</button><span class="sp"></span><button class="btn btn-primary" data-a="closeModal">Cerrar</button></div>`;
}
