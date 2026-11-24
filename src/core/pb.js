/* ---------- PocketBase lightweight REST sync ---------- */
const BASE = '/api';

const _pb = {
  ready: false,
  online: false,
  wsId: null,
  projMap: new Map(), // pid -> recordId
  taskMap: new Map(), // tid -> recordId
  snapProj: new Map(), // pid -> serialized payload
  snapTask: new Map(), // tid -> serialized payload
  snapWs: null,
  timer: null,
  chain: Promise.resolve(),
};

async function req(path, opt = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json', ...(opt.headers || {}) },
    ...opt,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`PB ${res.status}: ${msg}`);
  }
  return res.status === 204 ? null : res.json();
}

function serializeProject(p) {
  return {
    pid: p.id,
    key: p.key || '',
    name: p.name || 'Sin título',
    ptype: p.ptype || 'software',
    icon: p.icon || 'folder',
    color: p.color || 'indigo',
    status: p.status || 'planning',
    due: p.due || '',
    start: p.start || '',
    fav: !!p.fav,
    archived: !!p.archived,
    archivedAt: p.archivedAt || 0,
    desc: p.desc || '',
    milestones: p.milestones || [],
    seq: p.seq || 200,
    last: p.last || 0,
    lead: p.lead || '',
    team: p.team || '',
    members: p.members || [],
    private: !!p.private,
  };
}

function deserializeProject(r) {
  return {
    id: r.pid,
    key: r.key || 'PRJ',
    name: r.name,
    ptype: r.ptype || 'software',
    icon: r.icon || 'folder',
    color: r.color || 'indigo',
    status: r.status || 'planning',
    due: r.due || null,
    start: r.start || null,
    fav: !!r.fav,
    archived: !!r.archived,
    archivedAt: r.archivedAt || null,
    desc: r.desc || '',
    milestones: Array.isArray(r.milestones) ? r.milestones : [],
    seq: r.seq || 200,
    last: r.last || 0,
    lead: r.lead || 'm1',
    team: r.team || 'eng',
    members: Array.isArray(r.members) && r.members.length ? r.members : ['m1'],
    private: !!r.private,
  };
}

function serializeTask(t, comments) {
  return {
    tid: t.id,
    key: t.key || '',
    project: t.project || '',
    title: t.title || 'Sin título',
    status: t.status || 'todo',
    assignee: t.assignee || '',
    priority: t.priority || 'none',
    due: t.due || '',
    start: t.start || '',
    labels: t.labels || [],
    subtasks: t.subtasks || [],
    deps: t.deps || [],
    desc: t.desc || '',
    estimate: t.estimate || '',
    order: t.order ?? 0,
    fav: !!t.fav,
    recur: t.recur || '',
    archived: !!t.archived,
    archivedAt: t.archivedAt || 0,
    completedAt: t.completedAt || 0,
    prevStatus: t.prevStatus || '',
    createdAt: t.created || Date.now(),
    updatedAt: t.updated || Date.now(),
    comments: comments.filter(c => c.task === t.id),
  };
}

function deserializeTask(r) {
  return {
    id: r.tid,
    key: r.key,
    project: r.project,
    title: r.title,
    status: r.status || 'todo',
    assignee: r.assignee || null,
    priority: r.priority || 'none',
    due: r.due || null,
    start: r.start || null,
    labels: Array.isArray(r.labels) ? r.labels : [],
    subtasks: Array.isArray(r.subtasks) ? r.subtasks : [],
    deps: Array.isArray(r.deps) ? r.deps : [],
    desc: r.desc || '',
    estimate: r.estimate || null,
    order: r.order ?? 0,
    fav: !!r.fav,
    recur: r.recur || null,
    archived: !!r.archived,
    archivedAt: r.archivedAt || null,
    completedAt: r.completedAt || null,
    prevStatus: r.prevStatus || undefined,
    created: r.createdAt || Date.now(),
    updated: r.updatedAt || Date.now(),
    attachments: [],
  };
}

function serializeWorkspace(S) {
  const d = S.data;
  return {
    wkey: 'default',
    ws: d.ws,
    prefs: S.prefs,
    views: S.views,
    projOrder: d.projOrder || [],
    savedViews: d.savedViews || [],
    recentSearches: d.recentSearches || [],
    events: d.events || [],
    activity: (d.activity || []).slice(0, 120),
    collapsed: !!S.ui.collapsed,
  };
}

export async function initPocketBase(S, writeLocal, onUpdate) {
  try {
    await req('/health', { signal: AbortSignal.timeout(1500) });
  } catch {
    _pb.online = false;
    _pb.ready = true;
    S.ui.pbStatus = 'local';
    onUpdate?.();
    return false;
  }

  try {
    const [wsRes, projRes, taskRes] = await Promise.all([
      req("/collections/workspace/records?filter=(wkey='default')&perPage=1"),
      req('/collections/projects/records?perPage=500'),
      req('/collections/tasks/records?perPage=500'),
    ]);

    const wsRec = wsRes.items?.[0];
    if (wsRec) {
      _pb.wsId = wsRec.id;
      _pb.snapWs = JSON.stringify(
        serializeWorkspace({
          ...S,
          data: { ...S.data, ...wsRec },
          prefs: wsRec.prefs || S.prefs,
          views: wsRec.views || S.views,
          ui: { ...S.ui, collapsed: !!wsRec.collapsed },
        }),
      );

      const projects = (projRes.items || []).map(r => {
        _pb.projMap.set(r.pid, r.id);
        const p = deserializeProject(r);
        _pb.snapProj.set(p.id, JSON.stringify(serializeProject(p)));
        return p;
      });

      const comments = [];
      const tasks = (taskRes.items || []).map(r => {
        _pb.taskMap.set(r.tid, r.id);
        const t = deserializeTask(r);
        const cs = Array.isArray(r.comments) ? r.comments : [];
        comments.push(...cs);
        _pb.snapTask.set(t.id, JSON.stringify(serializeTask(t, cs)));
        return t;
      });

      if (wsRec.ws) S.data.ws = wsRec.ws;
      S.data.projects = projects;
      S.data.tasks = tasks;
      S.data.comments = comments;
      S.data.projOrder = Array.isArray(wsRec.projOrder) ? wsRec.projOrder : projects.map(p => p.id);
      S.data.savedViews = Array.isArray(wsRec.savedViews) ? wsRec.savedViews : [];
      S.data.recentSearches = Array.isArray(wsRec.recentSearches) ? wsRec.recentSearches : [];
      S.data.events = Array.isArray(wsRec.events) ? wsRec.events : [];
      S.data.activity = Array.isArray(wsRec.activity) ? wsRec.activity : [];
      if (wsRec.prefs) S.prefs = Object.assign({}, S.prefs, wsRec.prefs);
      if (wsRec.views) S.views = wsRec.views;
      S.ui.collapsed = !!wsRec.collapsed;

      writeLocal();
      _pb.online = true;
      _pb.ready = true;
      S.ui.pbStatus = 'synced';
      onUpdate?.();
    } else {
      _pb.online = true;
      _pb.ready = true;
      await pushFullToPb(S);
      S.ui.pbStatus = 'synced';
      onUpdate?.();
    }
    return true;
  } catch (err) {
    console.warn('PocketBase sync error, using localStorage:', err);
    _pb.online = false;
    _pb.ready = true;
    S.ui.pbStatus = 'local';
    onUpdate?.();
    return false;
  }
}

async function pushFullToPb(S) {
  const wsBody = serializeWorkspace(S);
  if (_pb.wsId) {
    await req(`/collections/workspace/records/${_pb.wsId}`, { method: 'PATCH', body: JSON.stringify(wsBody) });
  } else {
    const r = await req('/collections/workspace/records', { method: 'POST', body: JSON.stringify(wsBody) });
    _pb.wsId = r.id;
  }
  _pb.snapWs = JSON.stringify(wsBody);

  for (const p of S.data.projects) {
    const body = serializeProject(p);
    const r = await req('/collections/projects/records', { method: 'POST', body: JSON.stringify(body) });
    _pb.projMap.set(p.id, r.id);
    _pb.snapProj.set(p.id, JSON.stringify(body));
  }
  for (const t of S.data.tasks) {
    const body = serializeTask(t, S.data.comments);
    const r = await req('/collections/tasks/records', { method: 'POST', body: JSON.stringify(body) });
    _pb.taskMap.set(t.id, r.id);
    _pb.snapTask.set(t.id, JSON.stringify(body));
  }
}

async function runSync(S) {
  if (!_pb.online) return;
  try {
    // 1. Projects diff
    const curP = new Set(S.data.projects.map(p => p.id));
    for (const [pid, recId] of [..._pb.projMap.entries()]) {
      if (!curP.has(pid)) {
        await req(`/collections/projects/records/${recId}`, { method: 'DELETE' });
        _pb.projMap.delete(pid);
        _pb.snapProj.delete(pid);
      }
    }
    for (const p of S.data.projects) {
      const body = serializeProject(p);
      const json = JSON.stringify(body);
      if (_pb.snapProj.get(p.id) === json) continue;
      const recId = _pb.projMap.get(p.id);
      if (recId) {
        await req(`/collections/projects/records/${recId}`, { method: 'PATCH', body: json });
      } else {
        const r = await req('/collections/projects/records', { method: 'POST', body: json });
        _pb.projMap.set(p.id, r.id);
      }
      _pb.snapProj.set(p.id, json);
    }

    // 2. Tasks diff
    const curT = new Set(S.data.tasks.map(t => t.id));
    for (const [tid, recId] of [..._pb.taskMap.entries()]) {
      if (!curT.has(tid)) {
        await req(`/collections/tasks/records/${recId}`, { method: 'DELETE' });
        _pb.taskMap.delete(tid);
        _pb.snapTask.delete(tid);
      }
    }
    for (const t of S.data.tasks) {
      const body = serializeTask(t, S.data.comments);
      const json = JSON.stringify(body);
      if (_pb.snapTask.get(t.id) === json) continue;
      const recId = _pb.taskMap.get(t.id);
      if (recId) {
        await req(`/collections/tasks/records/${recId}`, { method: 'PATCH', body: json });
      } else {
        const r = await req('/collections/tasks/records', { method: 'POST', body: json });
        _pb.taskMap.set(t.id, r.id);
      }
      _pb.snapTask.set(t.id, json);
    }

    // 3. Workspace diff
    const wsBody = serializeWorkspace(S);
    const wsJson = JSON.stringify(wsBody);
    if (_pb.snapWs !== wsJson) {
      if (_pb.wsId) {
        await req(`/collections/workspace/records/${_pb.wsId}`, { method: 'PATCH', body: wsJson });
      } else {
        const r = await req('/collections/workspace/records', { method: 'POST', body: wsJson });
        _pb.wsId = r.id;
      }
      _pb.snapWs = wsJson;
    }

    if (S.ui.pbStatus !== 'synced') S.ui.pbStatus = 'synced';
  } catch (err) {
    console.warn('PocketBase sync failed:', err);
    S.ui.pbStatus = 'local';
  }
}

export function schedulePbSync(S) {
  if (!_pb.online) return;
  clearTimeout(_pb.timer);
  _pb.timer = setTimeout(() => {
    _pb.chain = _pb.chain.then(() => runSync(S));
  }, 320);
}
