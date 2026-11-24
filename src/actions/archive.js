/* =====================================================================
   ACTIONS · ARCHIVE: restore and purge
   ===================================================================== */
import { esc } from '../core/utils.js';
import { logAct, task } from '../core/store.js';
import { mutate, toast } from '../ui/toast.js';
import { A, confirmDlg, deleteTasks } from './actions.js';

A.restoreTask = el => {
  const t = task(el.dataset.id);
  if (
    mutate(() => {
      t.archived = false;
      t.archivedAt = null;
      logAct('restauró', t);
    })
  )
    toast(`Se restauró “${t.title}”`, { action: 'Abrir', onAction: () => A.openTask({ dataset: { id: t.id } }) });
};
A.purgeTask = el => {
  const t = task(el.dataset.id);
  confirmDlg({
    title: '¿Eliminar tarea permanentemente?',
    body: `<b>${esc(t.title)}</b>, sus subtareas y comentarios se eliminarán de forma definitiva. Esta acción no se puede deshacer.`,
    ok: 'Eliminar permanentemente',
    danger: true,
    run: () => {
      if (mutate(() => deleteTasks([t.id]))) toast(`Se eliminó “${t.title}”`);
    },
  });
};
