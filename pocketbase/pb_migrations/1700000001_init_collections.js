/// <reference path="../pb_data/types.d.ts" />

migrate(
  app => {
    const projects = new Collection({
      type: 'base',
      name: 'projects',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        { name: 'pid', type: 'text', required: true },
        { name: 'key', type: 'text' },
        { name: 'name', type: 'text', required: true },
        { name: 'ptype', type: 'text' },
        { name: 'icon', type: 'text' },
        { name: 'color', type: 'text' },
        { name: 'status', type: 'text' },
        { name: 'due', type: 'text' },
        { name: 'start', type: 'text' },
        { name: 'fav', type: 'bool' },
        { name: 'archived', type: 'bool' },
        { name: 'archivedAt', type: 'number' },
        { name: 'desc', type: 'text' },
        { name: 'milestones', type: 'json' },
        { name: 'seq', type: 'number' },
        { name: 'last', type: 'number' },
        { name: 'lead', type: 'text' },
        { name: 'team', type: 'text' },
        { name: 'members', type: 'json' },
        { name: 'private', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_projects_pid ON projects (pid)'],
    });
    app.save(projects);

    const tasks = new Collection({
      type: 'base',
      name: 'tasks',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        { name: 'tid', type: 'text', required: true },
        { name: 'key', type: 'text' },
        { name: 'project', type: 'text' },
        { name: 'title', type: 'text', required: true },
        { name: 'status', type: 'text' },
        { name: 'assignee', type: 'text' },
        { name: 'priority', type: 'text' },
        { name: 'due', type: 'text' },
        { name: 'start', type: 'text' },
        { name: 'labels', type: 'json' },
        { name: 'subtasks', type: 'json' },
        { name: 'deps', type: 'json' },
        { name: 'desc', type: 'text' },
        { name: 'estimate', type: 'text' },
        { name: 'order', type: 'number' },
        { name: 'fav', type: 'bool' },
        { name: 'recur', type: 'text' },
        { name: 'archived', type: 'bool' },
        { name: 'archivedAt', type: 'number' },
        { name: 'completedAt', type: 'number' },
        { name: 'prevStatus', type: 'text' },
        { name: 'createdAt', type: 'number' },
        { name: 'updatedAt', type: 'number' },
        { name: 'comments', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_tasks_tid ON tasks (tid)', 'CREATE INDEX idx_tasks_project ON tasks (project)'],
    });
    app.save(tasks);

    const workspace = new Collection({
      type: 'base',
      name: 'workspace',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        { name: 'wkey', type: 'text', required: true },
        { name: 'ws', type: 'json' },
        { name: 'prefs', type: 'json' },
        { name: 'views', type: 'json' },
        { name: 'projOrder', type: 'json' },
        { name: 'savedViews', type: 'json' },
        { name: 'recentSearches', type: 'json' },
        { name: 'events', type: 'json' },
        { name: 'activity', type: 'json' },
        { name: 'collapsed', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_workspace_wkey ON workspace (wkey)'],
    });
    app.save(workspace);
  },
  app => {
    for (const name of ['workspace', 'tasks', 'projects']) {
      try {
        const col = app.findCollectionByNameOrId(name);
        app.delete(col);
      } catch {
        /* ignore if missing */
      }
    }
  },
);
