/* ---------- vocab ---------- */
export const STATUSES = [
  { id: 'backlog', name: 'Backlog' },
  { id: 'todo', name: 'Pendiente' },
  { id: 'progress', name: 'En progreso' },
  { id: 'review', name: 'Revisión' },
  { id: 'done', name: 'Hecho' },
];
export const ST = Object.fromEntries(STATUSES.map(s => [s.id, s]));
export const PRIOS = [
  { id: 'urgent', name: 'Urgente', w: 4 },
  { id: 'high', name: 'Alta', w: 3 },
  { id: 'medium', name: 'Media', w: 2 },
  { id: 'low', name: 'Baja', w: 1 },
  { id: 'none', name: 'Sin prioridad', w: 0 },
];
export const PR = Object.fromEntries(PRIOS.map(p => [p.id, p]));
export const LABELS = [
  { id: 'feature', name: 'Feature', c: 'var(--indigo)' },
  { id: 'frontend', name: 'Frontend', c: 'var(--blue)' },
  { id: 'backend', name: 'Backend / API', c: 'var(--teal)' },
  { id: 'bug', name: 'Bug', c: 'var(--red)' },
  { id: 'refactor', name: 'Refactor', c: 'var(--violet)' },
  { id: 'audit', name: 'Auditoría', c: 'var(--amber)' },
  { id: 'pentest', name: 'Pentest', c: 'var(--rose)' },
  { id: 'hardening', name: 'Hardening', c: 'var(--green)' },
  { id: 'docs', name: 'Informe / Docs', c: 'var(--orange)' },
];
export const LB = Object.fromEntries(LABELS.map(l => [l.id, l]));
export const PTYPES = {
  software: { id: 'software', name: 'Desarrollo SW', icon: 'code', c: 'var(--blue)', defaultTab: 'board' },
  cyber: { id: 'cyber', name: 'Ciberseguridad', icon: 'shield', c: 'var(--teal)', defaultTab: 'list' },
};
export const PSTAT = {
  planning: { name: 'Planificación', c: 'var(--gray)' },
  active: { name: 'En curso', c: 'var(--blue)' },
  risk: { name: 'En riesgo', c: 'var(--red)' },
  hold: { name: 'En pausa', c: 'var(--amber)' },
  complete: { name: 'Completado', c: 'var(--green)' },
};
export const PCOLORS = {
  indigo: '#5A67D8',
  blue: '#3B82C4',
  violet: '#8662C9',
  teal: '#23918A',
  rose: '#C54B78',
  amber: '#C48A1E',
  green: '#3D8E5F',
  slate: '#6B7280',
};
export const PICONS = [
  'code',
  'shield',
  'terminal',
  'lock',
  'globe',
  'cpu',
  'database',
  'server',
  'bug',
  'rocket',
  'layers',
  'folder',
  'target',
  'zap',
  'briefcase',
  'sparkles',
];
export const ROLES = ['Owner', 'Admin', 'Member', 'Guest'];
export const TEAMS_SEED = [
  { id: 'eng', name: 'Desarrollo SW', icon: 'code', c: '#3B82C4', desc: 'Proyectos de software' },
  { id: 'sec', name: 'Ciberseguridad', icon: 'shield', c: '#23918A', desc: 'Servicios de ciberseguridad' },
];
