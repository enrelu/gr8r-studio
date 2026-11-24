/* ---------- seed data (plantillas en español para SW y Ciberseguridad) ---------- */
import { dOff, minsAgo, uid } from '../core/utils.js';

export function seed() {
  const members = [
    {
      id: 'm1',
      name: 'Personal',
      email: 'local@workspace',
      role: 'Owner',
      team: 'eng',
      title: 'Desarrollo & Ciberseguridad',
      c: '#5A67D8',
      status: 'active',
      last: 0,
      tz: 'Madrid',
    },
  ];
  const projects = [
    {
      id: 'p1',
      key: 'SW',
      name: 'Proyecto Plantilla · Desarrollo SW',
      ptype: 'software',
      icon: 'code',
      color: 'blue',
      status: 'active',
      team: 'eng',
      lead: 'm1',
      due: dOff(21),
      start: dOff(-7),
      fav: true,
      members: ['m1'],
      desc: 'Plantilla base para proyectos de desarrollo de software: planificación técnica, implementación, pruebas y despliegue.',
      milestones: [
        { id: 'ms1', name: 'Arquitectura y repo listos', date: dOff(-1), done: true },
        { id: 'ms2', name: 'MVP funcional', date: dOff(10), done: false },
        { id: 'ms3', name: 'Release v1.0', date: dOff(21), done: false },
      ],
      last: 15,
    },
    {
      id: 'p2',
      key: 'SEC',
      name: 'Servicio Plantilla · Ciberseguridad',
      ptype: 'cyber',
      icon: 'shield',
      color: 'teal',
      status: 'active',
      team: 'sec',
      lead: 'm1',
      due: dOff(18),
      start: dOff(-3),
      fav: true,
      members: ['m1'],
      desc: 'Plantilla base para servicios de ciberseguridad (auditoría, pentest o revisión): alcance, ejecución, informe y retest.',
      milestones: [
        { id: 'ms4', name: 'Kick-off y validación de alcance', date: dOff(1), done: true },
        { id: 'ms5', name: 'Fin de pruebas técnicas', date: dOff(9), done: false },
        { id: 'ms6', name: 'Entrega de informe', date: dOff(14), done: false },
        { id: 'ms7', name: 'Retest y cierre', date: dOff(18), done: false },
      ],
      last: 40,
    },
  ];

  let n = 0;
  const T = [];
  const t = (p, title, status, prio, due, labels = [], x = {}) => {
    const proj = projects.find(q => q.id === p);
    const count = T.filter(q => q.project === p).length + 1;
    T.push(
      Object.assign(
        {
          id: 't' + ++n,
          key: proj.key + '-' + (100 + count),
          project: p,
          title,
          status,
          assignee: 'm1',
          priority: prio,
          due: due == null ? null : dOff(due),
          start: due == null ? null : dOff(due - (x.len || 3)),
          labels,
          subtasks: [],
          attachments: [],
          deps: [],
          desc: '',
          estimate: x.est || null,
          created: minsAgo(60 * 24 * (x.age || 6)),
          updated: minsAgo(60 * (x.upd || 12)),
          order: n,
          fav: false,
          recur: null,
        },
        x,
      ),
    );
  };

  // Proyecto Plantilla · Desarrollo SW
  t('p1', 'Definir alcance, stack y estructura del repo', 'done', 'high', -2, ['docs'], { est: '2h', len: 2 });
  t('p1', 'Configurar entorno local, linter y build', 'done', 'medium', -1, ['backend'], { est: '2h', len: 1 });
  t('p1', 'Diseñar modelo de datos y API principal', 'progress', 'high', 2, ['backend'], {
    est: '1d',
    len: 4,
    fav: true,
    desc: '<p>Definir entidades principales, endpoints REST y validaciones básicas antes de implementar la interfaz.</p>',
    subtasks: [
      { id: 's1', title: 'Esquema de base de datos', done: true },
      { id: 's2', title: 'Endpoints CRUD', done: false },
      { id: 's3', title: 'Pruebas básicas de integración', done: false },
    ],
  });
  t('p1', 'Implementar interfaz y flujo principal', 'todo', 'high', 6, ['frontend', 'feature'], { est: '2d', len: 4, deps: ['t3'] });
  t('p1', 'Revisión de código y manejo de errores', 'review', 'medium', 9, ['refactor'], { est: '4h', len: 2 });
  t('p1', 'Preparar release v1.0 y checklist de despliegue', 'backlog', 'medium', 18, ['docs'], { est: '4h', len: 2 });

  // Servicio Plantilla · Ciberseguridad
  t('p2', 'Kick-off, definición de alcance y ventana de pruebas', 'done', 'high', 0, ['audit'], { est: '2h', len: 2 });
  t('p2', 'Recopilación de activos y reconocimiento inicial', 'progress', 'high', 3, ['pentest'], {
    est: '1d',
    len: 3,
    subtasks: [
      { id: 's4', title: 'Inventario de dominios / IPs en alcance', done: true },
      { id: 's5', title: 'Enumeración de servicios y endpoints', done: false },
    ],
  });
  t('p2', 'Ejecución de pruebas técnicas y validación de hallazgos', 'todo', 'urgent', 8, ['pentest', 'hardening'], {
    est: '3d',
    len: 5,
    fav: true,
    deps: ['t8'],
  });
  t('p2', 'Revisión de controles y recomendaciones de hardening', 'todo', 'medium', 10, ['hardening'], { est: '1d', len: 3 });
  t('p2', 'Redactar informe técnico y resumen ejecutivo', 'backlog', 'high', 14, ['docs'], { est: '2d', len: 4, deps: ['t9'] });
  t('p2', 'Sesión de entrega y retest de remediaciones', 'backlog', 'medium', 18, ['audit'], { est: '4h', len: 2, deps: ['t11'] });

  T.filter(x => x.status === 'done').forEach((x, i) => (x.completedAt = minsAgo(60 * (6 + i * 12))));

  const comments = [
    {
      id: 'c1',
      task: 't3',
      by: 'm1',
      at: minsAgo(120),
      text: 'Mantener el esquema mínimo para poder ampliar campos más adelante sin migraciones complejas.',
      re: {},
    },
  ];
  const A = (verb, task, project, m, extra = '') => ({ id: uid('a'), by: 'm1', verb, task, project, at: minsAgo(m), extra });
  const activity = [
    A('creó el proyecto', null, 'p1', 1440),
    A('creó el proyecto', null, 'p2', 900),
    A('completó', 't2', 'p1', 180),
    A('completó', 't7', 'p2', 90),
  ];

  return {
    ws: { name: 'Espacio Técnico', url: 'local', c: '#1D1C1A', brand: true },
    workspaces: [{ id: 'w1', name: 'Espacio Técnico', c: '#1D1C1A', plan: 'Local', brand: true }],
    me: 'm1',
    members,
    projects,
    tasks: T,
    comments,
    activity,
    notifs: [],
    files: [],
    events: [],
    projOrder: projects.map(p => p.id),
    savedViews: [],
    recentSearches: ['MVP', 'informe', 'API'],
    sessions: [],
    invoices: [],
    tfa: false,
    notifPrefs: {
      email_mention: false,
      email_assign: false,
      email_digest: false,
      email_comment: false,
      push_mention: false,
      push_assign: false,
      push_comment: false,
      push_due: false,
      mention_all: false,
      assign_self: false,
    },
  };
}
