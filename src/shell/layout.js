/* ---------- shell ---------- */
import { MOD, TODAY, diffD, esc, parse } from '../core/utils.js';
import { ic, wsLogo } from '../core/icons.js';
import { PSTAT } from '../core/constants.js';
import { D, S, SINGLE_USER, allTasks, mem, pColor, proj, team, teamsList, visibleProjects } from '../core/store.js';
import { av } from '../ui/helpers.js';
import { ROUTE_NAMES } from './render.js';
import { skeleton } from './skeletons.js';
import { pageHome } from '../pages/home.js';
import { pageOverview } from '../pages/overview.js';
import { pageMyTasks } from '../pages/my-tasks.js';
import { pageTasks } from '../pages/tasks.js';
import { pageInbox } from '../pages/inbox.js';
import { pageNotifications } from '../pages/notifications.js';
import { pageFavorites } from '../pages/favorites.js';
import { pageProjects } from '../pages/projects.js';
import { pageMember, pageMembers, pageTeam, pageTeams } from '../pages/members.js';
import { pageActivity } from '../pages/activity.js';
import { pageSearch } from '../pages/search.js';
import { page404, stateFailed } from '../pages/errors.js';
import { pageProject } from '../pages/project.js';
import { pageWsCalendar } from '../views/calendar.js';
import { pageWsTimeline } from '../views/timeline.js';
import { pageSettings } from '../pages/settings.js';
import { pageStates, pageSystem } from '../pages/design-system.js';
import { pageArchive } from '../features/archive.js';

export function renderShell() {
  const u = S.ui;
  return `<button class="skip" data-a="skipToContent">Ir al contenido</button><div class="shell ${u.collapsed ? 'collapsed' : ''} ${u.mnav ? 'mnav' : ''} ${u.fx.tabs ? 'fx-tabs' : ''}">
    ${renderSidebar()}
    ${u.mnav ? '<div class="side-scrim" data-a="closeMnav"></div>' : ''}
    <main class="main" id="main">
      ${renderTopbar()}
      ${u.offline ? `<div class="offline-bar" role="alert">${ic('wifi-off', 15)}<span><b>Sin conexión.</b> Los cambios no se guardarán hasta recuperar la conexión.</span><span class="sp"></span><button class="btn btn-sm btn-secondary" data-a="retryOnline">Reintentar</button></div>` : ''}
      <div class="content ${u.fx.route ? 'fx-route' : ''}" id="main-content" tabindex="-1" data-keep="c:${u.route}:${u.params.id || ''}:${u.params.tab || ''}:${u.params.sec || ''}">${u.loading ? skeleton() : renderPage()}</div>
    </main>
    ${renderBottomNav()}
  </div>`;
}
export function renderPage() {
  const r = S.ui.route;
  try {
    const P = {
      home: pageHome,
      inbox: pageInbox,
      mytasks: pageMyTasks,
      favorites: pageFavorites,
      notifications: pageNotifications,
      search: pageSearch,
      overview: pageOverview,
      projects: pageProjects,
      project: pageProject,
      tasks: pageTasks,
      calendar: pageWsCalendar,
      timeline: pageWsTimeline,
      members: pageMembers,
      member: pageMember,
      teams: pageTeams,
      team: pageTeam,
      activity: pageActivity,
      settings: pageSettings,
      system: pageSystem,
      states: pageStates,
      archive: pageArchive,
    };
    return (P[r] || page404)();
  } catch (e) {
    console.error(e);
    return stateFailed();
  }
}

export function sItem(route, label, icon, opt = {}) {
  const on = S.ui.route === route && (!opt.id || S.ui.params.id === opt.id);
  return `<button class="sitem ${on ? 'on' : ''}" data-a="${opt.act || 'go'}" data-r="${route}" ${opt.id ? `data-id="${opt.id}"` : ''} ${S.ui.collapsed ? `data-tip="${esc(label)}" data-tip-pos="right"` : ''} ${on ? 'aria-current="page"' : ''}>${ic(icon, 16)}<span class="trunc">${esc(label)}</span>${opt.ct ? `<span class="ct ${opt.dot ? 'dotc' : ''}">${opt.ct}</span>` : ''}${opt.kbd ? `<span class="ct hide-m"><kbd>${opt.kbd}</kbd></span>` : ''}</button>`;
}
export function renderSidebar() {
  const u = S.ui,
    d = D();
  const unreadInbox = d.notifs.filter(n => !n.read && n.type !== 'update').length;
  const unreadAll = d.notifs.filter(n => !n.read).length;
  const myOpen = allTasks().filter(t => (SINGLE_USER || t.assignee === d.me) && t.status !== 'done' && t.due && diffD(parse(t.due), TODAY) <= 0).length;
  const projs = visibleProjects().filter(p => p.status !== 'complete');
  const inProj = u.route === 'project' ? u.params.id : null;
  const pbLabel = u.pbStatus === 'synced' ? 'PocketBase activo' : u.pbStatus === 'connecting' ? 'Conectando…' : 'Modo local';
  const pbColor = u.pbStatus === 'synced' ? 'var(--green)' : u.pbStatus === 'connecting' ? 'var(--amber)' : 'var(--gray)';
  return `<nav class="side" aria-label="Principal">
    <div class="side-top">
      <div class="row" style="gap:2px">
        ${
          SINGLE_USER
            ? `<button class="ws grow" data-a="go" data-r="home" aria-label="Inicio">
                ${wsLogo(d.ws, 22)}
                <span class="ws-name trunc">${esc(d.ws.name)}</span>
              </button>`
            : `<button class="ws grow" data-a="pop" data-pop="ws" aria-haspopup="menu" aria-label="Cambiar espacio">
                ${wsLogo(d.ws, 22)}
                <span class="ws-name trunc">${esc(d.ws.name)}</span>
                <span class="chev-d faint">${ic('chevrons-up-down', 13)}</span>
              </button>`
        }
        ${u.collapsed ? '' : `<button class="ibtn ibtn-sm hide-m" data-a="toggleSide" data-tip="Colapsar barra  [" aria-label="Colapsar barra">${ic('panel-left', 15)}</button>`}
      </div>
    </div>
    <div class="side-scroll" data-keep="side">
      ${u.collapsed ? `<button class="sitem" data-a="toggleSide" data-tip="Expandir barra" data-tip-pos="right" aria-label="Expandir barra">${ic('panel-left', 16)}</button>` : ''}
      ${sItem('home', 'Inicio', 'house')}
      ${SINGLE_USER ? '' : sItem('inbox', 'Bandeja', 'inbox', { ct: unreadInbox || '', dot: true })}
      ${sItem('mytasks', 'Mis tareas', 'circle-check', { ct: myOpen || '' })}
      ${sItem('favorites', 'Favoritos', 'star')}
      ${SINGLE_USER ? '' : sItem('notifications', 'Notificaciones', 'bell', { ct: unreadAll || '' })}
      <div class="sgroup">
        <div class="sgroup-h">Espacio</div>
        ${sItem('overview', 'Resumen general', 'layout-dashboard')}
        ${sItem('projects', 'Proyectos', 'folder-kanban')}
        ${sItem('tasks', 'Tareas', 'list-checks')}
        ${sItem('calendar', 'Calendario', 'calendar')}
        ${sItem('timeline', 'Cronograma', 'chart-gantt')}
        ${SINGLE_USER ? '' : sItem('members', 'Miembros', 'users')}
        ${sItem('activity', 'Actividad', 'activity')}
      </div>
      <div class="sgroup" id="side-projects">
        <div class="sgroup-h"><span>Proyectos</span><span class="sp"></span><button class="ibtn ibtn-xs" data-a="newProject" data-tip="Nuevo proyecto  P" aria-label="Nuevo proyecto">${ic('plus', 14)}</button></div>
        ${projs
          .map(p => {
            const open = !!u.expanded[p.id];
            const on = inProj === p.id;
            return `<div class="sproj" data-proj-drop="${p.id}">
            <div class="sitem ${on ? 'on' : ''}" draggable="true" data-drag-proj="${p.id}" data-a="go" data-r="project" data-id="${p.id}" data-ctx="project" role="link" tabindex="0" ${u.collapsed ? `data-tip="${esc(p.name)}" data-tip-pos="right"` : ''}>
              <span class="pico" style="--c:${pColor(p)}" data-a="toggleExpand" data-id="${p.id}" aria-label="Mostrar subvistas">${ic(p.icon, 12)}</span>
              <span class="trunc">${esc(p.name)}</span>
              ${p.fav ? `<span class="fav">${ic('star', 11)}</span>` : ''}
              ${!SINGLE_USER && p.private ? `<span class="faint" style="margin-left:4px">${ic('lock', 11)}</span>` : ''}
              <span class="sdot" style="background:${PSTAT[p.status].c}" title="${PSTAT[p.status].name}"></span>
              <span class="hov"><span class="ibtn ibtn-xs" data-a="ctxBtn" data-ctx="project" data-id="${p.id}" aria-label="Opciones">${ic('ellipsis', 14)}</span><span class="ibtn ibtn-xs" data-a="toggleExpand" data-id="${p.id}" aria-label="Expandir">${ic('chevron-right', 13, 'chev ' + (open ? 'open' : ''))}</span></span>
            </div>
            <div class="sub ${open && !u.collapsed ? 'open' : ''}">
              ${[
                ['overview', 'Resumen', 'layout-dashboard'],
                ['board', 'Tablero', 'square-kanban'],
                ['list', 'Lista', 'list'],
                ['timeline', 'Cronograma', 'chart-gantt'],
              ]
                .map(
                  ([tab, n, i]) =>
                    `<button class="sitem ${on && u.params.tab === tab ? 'on' : ''}" data-a="go" data-r="project" data-id="${p.id}" data-tab="${tab}">${ic(i, 14)}<span>${n}</span></button>`,
                )
                .join('')}
            </div>
          </div>`;
          })
          .join('')}
        ${sItem('archive', 'Archivo', 'archive', { ct: D().tasks.filter(t => t.archived).length + D().projects.filter(p => p.archived).length || '' })}
      </div>
      ${
        SINGLE_USER
          ? ''
          : `<div class="sgroup">
        <div class="sgroup-h"><span>Equipos</span><span class="sp"></span><button class="ibtn ibtn-xs" data-a="newTeam" data-tip="Nuevo equipo" aria-label="Nuevo equipo">${ic('plus', 14)}</button></div>
        ${teamsList()
          .map(t => sItem('team', t.name, t.icon, { id: t.id }))
          .join('')}
      </div>`
      }
    </div>
    <div class="side-bot">
      <button class="sitem" data-a="pop" data-pop="help" ${u.collapsed ? 'data-tip="Ayuda y atajos" data-tip-pos="right"' : ''}>${ic('circle-help', 16)}<span>Ayuda y atajos</span></button>
      ${sItem('settings', 'Ajustes', 'settings')}
      ${
        SINGLE_USER
          ? `<div class="sitem" style="cursor:default;font-size:12px;color:var(--text-3)" ${u.collapsed ? `data-tip="${pbLabel}" data-tip-pos="right"` : ''}><span style="width:7px;height:7px;border-radius:50%;background:${pbColor};flex-shrink:0;margin:0 4px"></span><span class="trunc">${pbLabel}</span></div>`
          : `<button class="sitem" data-a="pop" data-pop="user" style="height:36px" ${u.collapsed ? 'data-tip="Perfil" data-tip-pos="right"' : ''}>${av(d.me, 'presence', false)}<span class="trunc" style="color:var(--text);font-weight:500">${esc(S.prefs.name)}</span><span class="ct">${ic('chevrons-up-down', 13)}</span></button>`
      }
    </div>
  </nav>`;
}

export function crumbs() {
  const u = S.ui,
    r = u.route,
    out = [];
  const c = (label, act = '', cur = false, icon = '') => `<button class="${cur ? 'cur' : ''}" ${act}>${icon}${esc(label)}</button>`;
  if (r === 'project') {
    const p = proj(u.params.id);
    out.push(c('Proyectos', 'data-a="go" data-r="projects"'));
    if (p)
      out.push(
        c(
          p.name,
          `data-a="go" data-r="project" data-id="${p.id}" data-tab="overview"`,
          true,
          `<span class="pico" style="--c:${pColor(p)};width:16px;height:16px;border-radius:4px;display:grid;place-items:center;color:${pColor(p)}">${ic(p.icon, 11)}</span>`,
        ),
      );
  } else if (r === 'member') {
    out.push(c('Miembros', 'data-a="go" data-r="members"'));
    out.push(c(mem(u.params.id)?.name || 'Miembro', '', true));
  } else if (r === 'team') {
    out.push(c('Equipos', 'data-a="go" data-r="teams"'));
    out.push(c(team(u.params.id)?.name || 'Equipo', '', true));
  } else if (r === 'settings') {
    out.push(c('Ajustes', '', true));
  } else out.push(c(ROUTE_NAMES[r] || 'No encontrado', '', true));
  return out.join('<span class="sep">/</span>');
}
export function renderTopbar() {
  return `<header class="topbar">
    <button class="ibtn" data-a="openMnav" aria-label="Abrir navegación" style="display:none" id="mnav-btn">${ic('menu', 17)}</button>
    <style>@media(max-width:900px){#mnav-btn{display:inline-flex!important}}</style>
    <nav class="crumbs trunc" aria-label="Ruta">${crumbs()}</nav>
    <span class="sp"></span>
    <button class="topsearch" data-a="openPalette" aria-label="Buscar o ejecutar comando">${ic('search', 14)}<span class="lbltxt">Buscar o ir a…</span><span class="kbd">${MOD}K</span></button>
    ${SINGLE_USER ? '' : `<button class="ibtn" data-a="go" data-r="notifications" data-tip="Notificaciones" aria-label="Notificaciones">${ic('bell', 16)}${D().notifs.some(n => !n.read) ? '<span style="position:absolute;top:6px;right:7px;width:7px;height:7px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 2px var(--surface)"></span>' : ''}</button>`}
    <button class="btn btn-secondary btn-sm" data-a="pop" data-pop="create" aria-haspopup="menu" aria-label="Crear nuevo">${ic('plus', 14)}<span class="hide-m">Nuevo</span>${ic('chevron-down', 12, 'hide-m')}</button>
    ${SINGLE_USER ? `<button class="ibtn hide-m" data-a="toggleDark" data-tip="Cambiar tema (${MOD}+Shift+L)" aria-label="Cambiar tema">${ic('sun-moon', 16)}</button>` : `<button class="ibtn hide-m" data-a="pop" data-pop="user" aria-label="Cuenta" style="width:auto;padding:0 2px">${av(D().me, 'md', false)}</button>`}
  </header>`;
}
export function renderBottomNav() {
  const r = S.ui.route;
  const b = (route, label, icon, extra = '') =>
    `<button class="${r === route ? 'on' : ''}" data-a="go" data-r="${route}">${ic(icon, 19)}<span>${label}</span>${extra}</button>`;
  return `<nav class="bottomnav" aria-label="Principal">
    ${b('home', 'Inicio', 'house')}${b('mytasks', 'Mis tareas', 'circle-check')}${b('projects', 'Proyectos', 'folder-kanban')}${b('tasks', 'Tareas', 'list-checks')}
    <button data-a="openMnav">${ic('ellipsis', 19)}<span>Más</span></button>
  </nav>`;
}
