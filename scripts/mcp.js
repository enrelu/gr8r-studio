import { randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline';

const PB_URL = (process.env.PB_URL || 'http://127.0.0.1:8090').replace(/\/+$/, '');
const SERVER_INFO = { name: 'gr8r-proyectos', version: '1.0.0' };
const PROTOCOL_VERSION = '2024-11-05';

const STATUS_NAMES = {
  backlog: 'Backlog',
  todo: 'Pendiente',
  progress: 'En progreso',
  review: 'Revisión',
  done: 'Hecho',
};

const PRIO_NAMES = {
  urgent: 'Urgente',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
  none: 'Sin prioridad',
};

const PTYPE_DEFAULTS = {
  software: { icon: 'code', color: 'blue', team: 'eng' },
  cyber: { icon: 'shield', color: 'teal', team: 'sec' },
};

const uid = (p = 'id') => `${p}${Date.now().toString(36)}${randomBytes(3).toString('hex')}`;
const escHtml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const toDescHtml = s => {
  if (!s) return '';
  const trimmed = String(s).trim();
  if (/^<[a-z]/i.test(trimmed)) return trimmed;
  return trimmed
    .split(/\n{2,}/)
    .map(p => `<p>${escHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
};
const stripHtml = s =>
  String(s || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

async function pb(path, opt = {}) {
  let res;
  try {
    res = await fetch(`${PB_URL}/api${path}`, {
      headers: { 'Content-Type': 'application/json', ...(opt.headers || {}) },
      signal: AbortSignal.timeout(5000),
      ...opt,
    });
  } catch (err) {
    throw new Error(`No se pudo conectar con PocketBase en ${PB_URL}. ¿Ejecutaste "npm run pb"? (${err.message})`);
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`PocketBase HTTP ${res.status}: ${txt}`);
  }
  return res.status === 204 ? null : res.json();
}

async function listAllProjects() {
  const res = await pb('/collections/projects/records?perPage=500');
  return res.items || [];
}

async function listAllTasks() {
  const res = await pb('/collections/tasks/records?perPage=500');
  return res.items || [];
}

async function getWorkspaceRecord() {
  const res = await pb("/collections/workspace/records?filter=(wkey='default')&perPage=1");
  return res.items?.[0] || null;
}

async function ensureWorkspace() {
  const existing = await getWorkspaceRecord();
  if (existing) return existing;
  const projects = await listAllProjects();
  const body = {
    wkey: 'default',
    ws: { name: 'Espacio Técnico', url: 'local', c: '#1D1C1A', brand: true },
    prefs: {
      theme: 'system',
      accent: 'indigo',
      side: 'comfortable',
      density: 'comfortable',
      weekStart: 1,
      dateFmt: 'd/M',
      timeFmt: '24',
      lang: 'Español',
      tz: '(GMT+01:00) Madrid',
      motion: 'system',
      home: 'home',
      openTasks: 'drawer',
      defaultTab: 'auto',
      name: 'Personal',
      title: 'Desarrollo & Ciberseguridad',
    },
    views: {},
    projOrder: projects.map(p => p.pid),
    savedViews: [],
    recentSearches: [],
    events: [],
    activity: [],
    collapsed: false,
  };
  return pb('/collections/workspace/records', { method: 'POST', body: JSON.stringify(body) });
}

async function appendActivity(verb, taskPid, projectPid, extra = '') {
  const ws = await ensureWorkspace();
  const act = Array.isArray(ws.activity) ? [...ws.activity] : [];
  act.unshift({
    id: uid('a'),
    by: 'm1',
    verb,
    task: taskPid || null,
    project: projectPid || null,
    at: Date.now(),
    extra,
  });
  await pb(`/collections/workspace/records/${ws.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ activity: act.slice(0, 120) }),
  });
}

async function findProject(ref) {
  if (!ref) throw new Error('Debes indicar el proyecto (id, pid o key como SW / SEC).');
  const q = String(ref).trim().toLowerCase();
  const items = await listAllProjects();
  const found = items.find(p => p.pid.toLowerCase() === q || p.id.toLowerCase() === q || (p.key || '').toLowerCase() === q);
  if (!found) throw new Error(`Proyecto no encontrado: "${ref}"`);
  return found;
}

async function findTask(ref) {
  if (!ref) throw new Error('Debes indicar la tarea (id, tid o key como SW-101).');
  const q = String(ref).trim().toLowerCase();
  const items = await listAllTasks();
  const found = items.find(t => t.tid.toLowerCase() === q || t.id.toLowerCase() === q || (t.key || '').toLowerCase() === q);
  if (!found) throw new Error(`Tarea no encontrada: "${ref}"`);
  return found;
}

function summarizeProject(p, tasks) {
  const active = tasks.filter(t => t.project === p.pid && !t.archived);
  const done = active.filter(t => t.status === 'done').length;
  const ms = Array.isArray(p.milestones) ? p.milestones : [];
  const msDone = ms.filter(m => m.done).length;
  return {
    pid: p.pid,
    key: p.key,
    name: p.name,
    ptype: p.ptype || 'software',
    status: p.status || 'active',
    archived: !!p.archived,
    start: p.start || null,
    due: p.due || null,
    progressPct: active.length ? Math.round((done / active.length) * 100) : 0,
    tasksTotal: active.length,
    tasksDone: done,
    milestonesTotal: ms.length,
    milestonesDone: msDone,
  };
}

function summarizeTask(t) {
  const subs = Array.isArray(t.subtasks) ? t.subtasks : [];
  return {
    tid: t.tid,
    key: t.key,
    project: t.project,
    title: t.title,
    status: t.status,
    statusName: STATUS_NAMES[t.status] || t.status,
    priority: t.priority || 'none',
    priorityName: PRIO_NAMES[t.priority || 'none'] || t.priority,
    start: t.start || null,
    due: t.due || null,
    labels: Array.isArray(t.labels) ? t.labels : [],
    estimate: t.estimate || null,
    subtasksTotal: subs.length,
    subtasksDone: subs.filter(s => s.done).length,
    commentsCount: Array.isArray(t.comments) ? t.comments.length : 0,
    archived: !!t.archived,
  };
}

const TOOLS = [
  {
    name: 'pb_health',
    description: 'Comprueba la conexión con PocketBase y devuelve el resumen del espacio de trabajo.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    async run() {
      const [health, projects, tasks, ws] = await Promise.all([pb('/health'), listAllProjects(), listAllTasks(), getWorkspaceRecord()]);
      return {
        ok: true,
        pbUrl: PB_URL,
        health,
        workspaceInitialized: !!ws,
        projectsCount: projects.filter(p => !p.archived).length,
        tasksActiveCount: tasks.filter(t => !t.archived).length,
      };
    },
  },
  {
    name: 'list_projects',
    description: 'Lista todos los proyectos de Desarrollo SW y Ciberseguridad con su progreso, tareas e hitos.',
    inputSchema: {
      type: 'object',
      properties: {
        ptype: { type: 'string', enum: ['software', 'cyber'], description: 'Filtrar por tipo de proyecto.' },
        status: { type: 'string', enum: ['planning', 'active', 'risk', 'hold', 'complete'], description: 'Filtrar por estado.' },
        includeArchived: { type: 'boolean', description: 'Incluir proyectos archivados (por defecto false).' },
      },
      additionalProperties: false,
    },
    async run(args = {}) {
      const [projects, tasks] = await Promise.all([listAllProjects(), listAllTasks()]);
      const filtered = projects.filter(p => {
        if (!args.includeArchived && p.archived) return false;
        if (args.ptype && (p.ptype || 'software') !== args.ptype) return false;
        if (args.status && p.status !== args.status) return false;
        return true;
      });
      return { projects: filtered.map(p => summarizeProject(p, tasks)) };
    },
  },
  {
    name: 'get_project',
    description: 'Obtiene el detalle completo de un proyecto (por pid o key como SW / SEC), sus hitos y sus tareas.',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'ID interno (p1) o clave del proyecto (SW, SEC).' },
      },
      required: ['project'],
      additionalProperties: false,
    },
    async run(args) {
      const [p, tasks] = await Promise.all([findProject(args.project), listAllTasks()]);
      const projTasks = tasks.filter(t => t.project === p.pid && !t.archived).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      return {
        ...summarizeProject(p, tasks),
        desc: p.desc || '',
        milestones: Array.isArray(p.milestones) ? p.milestones : [],
        tasks: projTasks.map(summarizeTask),
      };
    },
  },
  {
    name: 'create_project',
    description: 'Crea un nuevo proyecto de Desarrollo SW o servicio de Ciberseguridad.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nombre del proyecto o servicio.' },
        key: { type: 'string', description: 'Prefijo corto para claves de tareas (ej. API, AUD). Se autogenera si se omite.' },
        ptype: { type: 'string', enum: ['software', 'cyber'], description: 'Tipo: software o cyber.' },
        status: { type: 'string', enum: ['planning', 'active', 'risk', 'hold', 'complete'], description: 'Estado inicial.' },
        desc: { type: 'string', description: 'Descripción breve del alcance.' },
        start: { type: 'string', description: 'Fecha de inicio YYYY-MM-DD.' },
        due: { type: 'string', description: 'Fecha objetivo YYYY-MM-DD.' },
        milestones: {
          type: 'array',
          description: 'Lista opcional de hitos iniciales.',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              date: { type: 'string', description: 'YYYY-MM-DD' },
              done: { type: 'boolean' },
            },
            required: ['name'],
          },
        },
      },
      required: ['name'],
      additionalProperties: false,
    },
    async run(args) {
      const ws = await ensureWorkspace();
      const existing = await listAllProjects();
      const ptype = args.ptype === 'cyber' ? 'cyber' : 'software';
      const def = PTYPE_DEFAULTS[ptype];
      let baseKey =
        (args.key || '')
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(0, 5) ||
        args.name
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(0, 3) ||
        (ptype === 'cyber' ? 'SEC' : 'SW');
      const usedKeys = new Set(existing.map(x => (x.key || '').toUpperCase()));
      let key = baseKey;
      let idx = 2;
      while (usedKeys.has(key)) {
        key = `${baseKey.slice(0, 4)}${idx++}`;
      }

      const pid = uid('p');
      const milestones = (args.milestones || []).map(m => ({
        id: uid('ms'),
        name: m.name,
        date: m.date || null,
        done: !!m.done,
      }));
      const body = {
        pid,
        key,
        name: args.name.trim(),
        ptype,
        icon: def.icon,
        color: def.color,
        status: args.status || 'active',
        due: args.due || '',
        start: args.start || '',
        fav: false,
        archived: false,
        archivedAt: 0,
        desc: args.desc || '',
        milestones,
        seq: 100,
        last: 0,
        lead: 'm1',
        team: def.team,
        members: ['m1'],
        private: false,
      };
      const created = await pb('/collections/projects/records', { method: 'POST', body: JSON.stringify(body) });
      const order = Array.isArray(ws.projOrder) ? [...ws.projOrder] : [];
      if (!order.includes(pid)) order.push(pid);
      await pb(`/collections/workspace/records/${ws.id}`, { method: 'PATCH', body: JSON.stringify({ projOrder: order }) });
      await appendActivity('creó el proyecto', null, pid);
      return summarizeProject(created, []);
    },
  },
  {
    name: 'update_project',
    description: 'Actualiza los datos, estado, fechas o archivo de un proyecto existente.',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'ID interno (p1) o clave del proyecto (SW).' },
        name: { type: 'string' },
        ptype: { type: 'string', enum: ['software', 'cyber'] },
        status: { type: 'string', enum: ['planning', 'active', 'risk', 'hold', 'complete'] },
        desc: { type: 'string' },
        start: { type: 'string', description: 'YYYY-MM-DD o vacío para limpiar.' },
        due: { type: 'string', description: 'YYYY-MM-DD o vacío para limpiar.' },
        archived: { type: 'boolean' },
      },
      required: ['project'],
      additionalProperties: false,
    },
    async run(args) {
      const p = await findProject(args.project);
      const patch = {};
      if (args.name !== undefined) patch.name = args.name.trim();
      if (args.ptype !== undefined) patch.ptype = args.ptype;
      if (args.status !== undefined) patch.status = args.status;
      if (args.desc !== undefined) patch.desc = args.desc;
      if (args.start !== undefined) patch.start = args.start || '';
      if (args.due !== undefined) patch.due = args.due || '';
      if (args.archived !== undefined) {
        patch.archived = !!args.archived;
        patch.archivedAt = args.archived ? Date.now() : 0;
      }
      const updated = await pb(`/collections/projects/records/${p.id}`, { method: 'PATCH', body: JSON.stringify(patch) });
      await appendActivity('actualizó el proyecto', null, p.pid);
      const tasks = await listAllTasks();
      return summarizeProject(updated, tasks);
    },
  },
  {
    name: 'manage_milestone',
    description: 'Añade, marca como completado/pendiente, edita o elimina un hito de un proyecto.',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'ID interno (p1) o clave del proyecto (SW).' },
        action: { type: 'string', enum: ['add', 'toggle', 'update', 'delete'] },
        milestoneId: { type: 'string', description: 'ID del hito (para toggle, update o delete).' },
        name: { type: 'string', description: 'Nombre del hito (obligatorio en add, opcional en update o búsqueda).' },
        date: { type: 'string', description: 'Fecha objetivo YYYY-MM-DD.' },
        done: { type: 'boolean', description: 'Estado completado explícito.' },
      },
      required: ['project', 'action'],
      additionalProperties: false,
    },
    async run(args) {
      const p = await findProject(args.project);
      const list = Array.isArray(p.milestones) ? [...p.milestones] : [];
      let targetIdx = -1;
      if (args.action !== 'add') {
        targetIdx = list.findIndex(
          m => (args.milestoneId && m.id === args.milestoneId) || (!args.milestoneId && args.name && m.name.toLowerCase() === args.name.toLowerCase()),
        );
        if (targetIdx < 0) throw new Error('Hito no encontrado en el proyecto.');
      }

      let verb = 'actualizó hito en';
      let extra = '';
      if (args.action === 'add') {
        if (!args.name) throw new Error('Indica "name" para crear el hito.');
        const ms = { id: uid('ms'), name: args.name.trim(), date: args.date || null, done: !!args.done };
        list.push(ms);
        verb = 'añadió hito en';
        extra = ms.name;
      } else if (args.action === 'toggle') {
        const cur = list[targetIdx];
        const nextDone = args.done !== undefined ? !!args.done : !cur.done;
        list[targetIdx] = { ...cur, done: nextDone };
        verb = nextDone ? 'completó hito en' : 'reabrió hito en';
        extra = cur.name;
      } else if (args.action === 'update') {
        const cur = list[targetIdx];
        list[targetIdx] = {
          ...cur,
          name: args.name !== undefined ? args.name.trim() : cur.name,
          date: args.date !== undefined ? args.date || null : cur.date,
          done: args.done !== undefined ? !!args.done : cur.done,
        };
        extra = list[targetIdx].name;
      } else if (args.action === 'delete') {
        extra = list[targetIdx].name;
        list.splice(targetIdx, 1);
        verb = 'eliminó hito en';
      }

      const updated = await pb(`/collections/projects/records/${p.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ milestones: list }),
      });
      await appendActivity(verb, null, p.pid, extra);
      return { project: p.key, milestones: updated.milestones || [] };
    },
  },
  {
    name: 'list_tasks',
    description: 'Lista tareas filtrando por proyecto, estado, prioridad, etiqueta o texto.',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'ID interno (p1) o clave del proyecto (SW).' },
        status: { type: 'string', enum: ['backlog', 'todo', 'progress', 'review', 'done'] },
        priority: { type: 'string', enum: ['urgent', 'high', 'medium', 'low', 'none'] },
        label: { type: 'string', description: 'ID de etiqueta (feature, backend, pentest, audit, etc.).' },
        query: { type: 'string', description: 'Texto a buscar en título, clave o descripción.' },
        includeArchived: { type: 'boolean' },
      },
      additionalProperties: false,
    },
    async run(args = {}) {
      let pidFilter = null;
      if (args.project) {
        const p = await findProject(args.project);
        pidFilter = p.pid;
      }
      const tasks = await listAllTasks();
      const q = (args.query || '').trim().toLowerCase();
      const filtered = tasks
        .filter(t => {
          if (!args.includeArchived && t.archived) return false;
          if (pidFilter && t.project !== pidFilter) return false;
          if (args.status && t.status !== args.status) return false;
          if (args.priority && (t.priority || 'none') !== args.priority) return false;
          if (args.label && !(Array.isArray(t.labels) && t.labels.includes(args.label))) return false;
          if (q) {
            const hay = `${t.key} ${t.title} ${stripHtml(t.desc)}`.toLowerCase();
            if (!hay.includes(q)) return false;
          }
          return true;
        })
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      return { total: filtered.length, tasks: filtered.map(summarizeTask) };
    },
  },
  {
    name: 'get_task',
    description: 'Devuelve el detalle completo de una tarea (descripción, subtareas, comentarios y dependencias).',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string', description: 'Clave (ej. SW-103) o ID interno (t3) de la tarea.' },
      },
      required: ['task'],
      additionalProperties: false,
    },
    async run(args) {
      const t = await findTask(args.task);
      return {
        ...summarizeTask(t),
        desc: stripHtml(t.desc),
        descHtml: t.desc || '',
        subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
        comments: Array.isArray(t.comments) ? t.comments : [],
        deps: Array.isArray(t.deps) ? t.deps : [],
        recur: t.recur || null,
      };
    },
  },
  {
    name: 'create_task',
    description: 'Crea una nueva tarea en un proyecto y asigna automáticamente su clave correlativa.',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'ID interno (p1) o clave del proyecto (SW).' },
        title: { type: 'string', description: 'Título de la tarea.' },
        status: { type: 'string', enum: ['backlog', 'todo', 'progress', 'review', 'done'] },
        priority: { type: 'string', enum: ['urgent', 'high', 'medium', 'low', 'none'] },
        due: { type: 'string', description: 'Fecha límite YYYY-MM-DD.' },
        start: { type: 'string', description: 'Fecha de inicio YYYY-MM-DD.' },
        labels: { type: 'array', items: { type: 'string' } },
        desc: { type: 'string', description: 'Notas o descripción.' },
        estimate: { type: 'string', description: 'Estimación (ej. 2h, 1d).' },
        subtasks: {
          type: 'array',
          items: { type: 'string' },
          description: 'Títulos de subtareas iniciales.',
        },
      },
      required: ['project', 'title'],
      additionalProperties: false,
    },
    async run(args) {
      await ensureWorkspace();
      const [p, tasks] = await Promise.all([findProject(args.project), listAllTasks()]);
      const nextSeq = (p.seq || 200) + 1;
      const key = `${p.key}-${nextSeq}`;
      const maxOrder = Math.max(0, ...tasks.map(t => t.order ?? 0));
      const now = Date.now();
      const tid = uid('t');
      const status = args.status || 'todo';
      const body = {
        tid,
        key,
        project: p.pid,
        title: args.title.trim(),
        status,
        assignee: 'm1',
        priority: args.priority || 'none',
        due: args.due || '',
        start: args.start || '',
        labels: Array.isArray(args.labels) ? args.labels : [],
        subtasks: (args.subtasks || []).map(title => ({ id: uid('s'), title: String(title).trim(), done: false })),
        deps: [],
        desc: toDescHtml(args.desc || ''),
        estimate: args.estimate || '',
        order: maxOrder + 1,
        fav: false,
        recur: '',
        archived: false,
        archivedAt: 0,
        completedAt: status === 'done' ? now : 0,
        prevStatus: '',
        createdAt: now,
        updatedAt: now,
        comments: [],
      };
      const created = await pb('/collections/tasks/records', { method: 'POST', body: JSON.stringify(body) });
      await pb(`/collections/projects/records/${p.id}`, { method: 'PATCH', body: JSON.stringify({ seq: nextSeq }) });
      await appendActivity('creó', tid, p.pid);
      return summarizeTask(created);
    },
  },
  {
    name: 'update_task',
    description: 'Actualiza el estado, prioridad, fechas, descripción, etiquetas o archivado de una tarea.',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string', description: 'Clave (ej. SW-103) o ID interno (t3).' },
        title: { type: 'string' },
        status: { type: 'string', enum: ['backlog', 'todo', 'progress', 'review', 'done'] },
        priority: { type: 'string', enum: ['urgent', 'high', 'medium', 'low', 'none'] },
        due: { type: 'string', description: 'YYYY-MM-DD o vacío para quitar.' },
        start: { type: 'string', description: 'YYYY-MM-DD o vacío para quitar.' },
        labels: { type: 'array', items: { type: 'string' } },
        desc: { type: 'string' },
        estimate: { type: 'string' },
        archived: { type: 'boolean' },
      },
      required: ['task'],
      additionalProperties: false,
    },
    async run(args) {
      const t = await findTask(args.task);
      const now = Date.now();
      const patch = { updatedAt: now };
      const acts = [];

      if (args.title !== undefined && args.title.trim() !== t.title) {
        patch.title = args.title.trim();
        acts.push(['renombró', `a “${patch.title}”`]);
      }
      if (args.status !== undefined && args.status !== t.status) {
        patch.status = args.status;
        if (args.status === 'done') {
          patch.completedAt = now;
          patch.prevStatus = t.status;
          acts.push(['completó', '']);
        } else {
          acts.push(['movió', `de ${STATUS_NAMES[t.status] || t.status} a ${STATUS_NAMES[args.status] || args.status}`]);
        }
      }
      if (args.priority !== undefined && args.priority !== t.priority) {
        patch.priority = args.priority;
        acts.push(['cambió prioridad de', `a ${PRIO_NAMES[args.priority] || args.priority}`]);
      }
      if (args.due !== undefined) patch.due = args.due || '';
      if (args.start !== undefined) patch.start = args.start || '';
      if (args.labels !== undefined) patch.labels = args.labels;
      if (args.desc !== undefined) patch.desc = toDescHtml(args.desc);
      if (args.estimate !== undefined) patch.estimate = args.estimate || '';
      if (args.archived !== undefined) {
        patch.archived = !!args.archived;
        patch.archivedAt = args.archived ? now : 0;
        acts.push([args.archived ? 'archivó' : 'restauró', '']);
      }

      const updated = await pb(`/collections/tasks/records/${t.id}`, { method: 'PATCH', body: JSON.stringify(patch) });
      for (const [verb, extra] of acts) {
        await appendActivity(verb, t.tid, t.project, extra);
      }
      return summarizeTask(updated);
    },
  },
  {
    name: 'manage_subtask',
    description: 'Añade, marca/desmarca, renombra o elimina una subtarea dentro de una tarea.',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string', description: 'Clave (ej. SW-103) o ID interno (t3).' },
        action: { type: 'string', enum: ['add', 'toggle', 'update', 'delete'] },
        subtaskId: { type: 'string', description: 'ID de la subtarea.' },
        title: { type: 'string', description: 'Título de la subtarea (obligatorio en add).' },
        done: { type: 'boolean' },
      },
      required: ['task', 'action'],
      additionalProperties: false,
    },
    async run(args) {
      const t = await findTask(args.task);
      const subs = Array.isArray(t.subtasks) ? [...t.subtasks] : [];
      let idx = -1;
      if (args.action !== 'add') {
        idx = subs.findIndex(
          s => (args.subtaskId && s.id === args.subtaskId) || (!args.subtaskId && args.title && s.title.toLowerCase() === args.title.toLowerCase()),
        );
        if (idx < 0) throw new Error('Subtarea no encontrada.');
      }

      if (args.action === 'add') {
        if (!args.title) throw new Error('Indica "title" para añadir la subtarea.');
        subs.push({ id: uid('s'), title: args.title.trim(), done: !!args.done });
      } else if (args.action === 'toggle') {
        const cur = subs[idx];
        subs[idx] = { ...cur, done: args.done !== undefined ? !!args.done : !cur.done };
      } else if (args.action === 'update') {
        const cur = subs[idx];
        subs[idx] = {
          ...cur,
          title: args.title !== undefined ? args.title.trim() : cur.title,
          done: args.done !== undefined ? !!args.done : cur.done,
        };
      } else if (args.action === 'delete') {
        subs.splice(idx, 1);
      }

      const updated = await pb(`/collections/tasks/records/${t.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ subtasks: subs, updatedAt: Date.now() }),
      });
      return { key: updated.key, subtasks: updated.subtasks || [] };
    },
  },
  {
    name: 'add_comment',
    description: 'Añade un comentario de seguimiento o nota técnica a una tarea.',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string', description: 'Clave (ej. SW-103) o ID interno (t3).' },
        text: { type: 'string', description: 'Contenido del comentario.' },
      },
      required: ['task', 'text'],
      additionalProperties: false,
    },
    async run(args) {
      const t = await findTask(args.task);
      const text = (args.text || '').trim();
      if (!text) throw new Error('El comentario no puede estar vacío.');
      const now = Date.now();
      const comments = Array.isArray(t.comments) ? [...t.comments] : [];
      const comment = { id: uid('c'), task: t.tid, by: 'm1', at: now, text, re: {} };
      comments.push(comment);
      await pb(`/collections/tasks/records/${t.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ comments, updatedAt: now }),
      });
      await appendActivity('comentó en', t.tid, t.project);
      return { key: t.key, comment };
    },
  },
];

const TOOL_MAP = Object.fromEntries(TOOLS.map(t => [t.name, t]));

function send(msg) {
  process.stdout.write(`${JSON.stringify(msg)}\n`);
}

async function handleRequest(msg) {
  const { id, method, params } = msg;
  const hasId = id !== undefined && id !== null;

  try {
    if (method === 'initialize') {
      if (hasId) {
        send({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: params?.protocolVersion || PROTOCOL_VERSION,
            capabilities: { tools: {} },
            serverInfo: SERVER_INFO,
          },
        });
      }
      return;
    }
    if (method === 'notifications/initialized' || method === 'notifications/cancelled') {
      return;
    }
    if (method === 'ping') {
      if (hasId) send({ jsonrpc: '2.0', id, result: {} });
      return;
    }
    if (method === 'tools/list') {
      if (hasId) {
        send({
          jsonrpc: '2.0',
          id,
          result: {
            tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
          },
        });
      }
      return;
    }
    if (method === 'tools/call') {
      const tool = TOOL_MAP[params?.name];
      if (!tool) {
        if (hasId) {
          send({
            jsonrpc: '2.0',
            id,
            result: { content: [{ type: 'text', text: `Herramienta desconocida: ${params?.name}` }], isError: true },
          });
        }
        return;
      }
      try {
        const result = await tool.run(params?.arguments || {});
        if (hasId) {
          send({
            jsonrpc: '2.0',
            id,
            result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] },
          });
        }
      } catch (err) {
        if (hasId) {
          send({
            jsonrpc: '2.0',
            id,
            result: { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true },
          });
        }
      }
      return;
    }
    if (hasId) {
      send({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } });
    }
  } catch (err) {
    console.error('[gr8r-mcp] Error interno:', err);
    if (hasId) {
      send({ jsonrpc: '2.0', id, error: { code: -32603, message: err.message } });
    }
  }
}

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on('line', line => {
  const trimmed = line.trim();
  if (!trimmed) return;
  try {
    const msg = JSON.parse(trimmed);
    void handleRequest(msg);
  } catch (err) {
    console.error('[gr8r-mcp] JSON inválido:', err.message);
  }
});
