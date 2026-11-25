/* =====================================================================
   CORE — utils & Spanish date helpers
   ===================================================================== */
// Web fonts load without blocking first paint (the link starts as media=print).
document.querySelectorAll('link[data-font]').forEach(l => {
  l.media = 'all';
});
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const uid = (p = 'x') => p + Math.random().toString(36).slice(2, 8);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
export const MOD = isMac ? '⌘' : 'Ctrl';

/* ---------- dates ---------- */
export const DAY = 864e5;
export const sod = d => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
export const TODAY = sod(new Date());
export const iso = d => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
export const parse = s => {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const addD = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
export const dOff = n => iso(addD(TODAY, n));
export const diffD = (a, b) => Math.round((sod(a) - sod(b)) / DAY);
export const MON = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
export const MONL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
export const WD = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const WDL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
/* Set from preferences on every render (core/theme.js), so utils never depends on the store. */
export let dateFormat = 'd/M';
export function setDateFormat(f) {
  dateFormat = f || 'd/M';
}
export function fmtDate(s, long) {
  const d = typeof s === 'string' ? parse(s) : s;
  if (!d) return '';
  const fmt = dateFormat;
  if (fmt === 'd/M') return `${d.getDate()}/${d.getMonth() + 1}${long ? '/' + d.getFullYear() : ''}`;
  if (fmt === 'M/d') return `${d.getMonth() + 1}/${d.getDate()}${long ? '/' + d.getFullYear() : ''}`;
  if (fmt === 'dd-MM-yyyy') return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  if (fmt === 'yyyy-MM-dd') return iso(d);
  return `${d.getDate()} ${MON[d.getMonth()]}${long || d.getFullYear() !== TODAY.getFullYear() ? ' ' + d.getFullYear() : ''}`;
}
export function relDate(s) {
  if (!s) return '';
  const n = diffD(parse(s), TODAY);
  if (n === 0) return 'Hoy';
  if (n === 1) return 'Mañana';
  if (n === -1) return 'Ayer';
  if (n > 1 && n < 7) return WDL[parse(s).getDay()];
  return fmtDate(s);
}
export function ago(ts) {
  const m = Math.round((Date.now() - ts) / 6e4);
  if (m < 1) return 'ahora mismo';
  if (m < 60) return `hace ${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.round(h / 24);
  if (d < 7) return `hace ${d}d`;
  return fmtDate(iso(new Date(ts)));
}
export const minsAgo = m => Date.now() - m * 6e4;
export function dayBucket(ts) {
  const n = diffD(new Date(ts), TODAY);
  if (n === 0) return 'Hoy';
  if (n === -1) return 'Ayer';
  if (n > -7) return 'Esta semana';
  return 'Anteriores';
}
