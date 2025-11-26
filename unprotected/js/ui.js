// Handles rendering and DOM event wiring for the Secure Tasks app

/**
 * Render the list of tasks to the DOM.
 * @param {Array} tasks - list of all tasks
 * @param {'all'|'active'|'completed'} filter
 */
export function renderTasks(tasks, filter) {
  const listEl = document.getElementById('task-list');
  const emptyStateEl = document.getElementById('empty-state');

  if (!listEl || !emptyStateEl) return;

  let filtered = tasks;
  if (filter === 'active') {
    filtered = tasks.filter(t => !t.completed);
  } else if (filter === 'completed') {
    filtered = tasks.filter(t => t.completed);
  }

  listEl.innerHTML = '';

  if (!filtered.length) {
    emptyStateEl.style.display = 'block';
    return;
  } else {
    emptyStateEl.style.display = 'none';
  }

  for (const task of filtered) {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' completed' : '');
    li.dataset.id = task.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('data-action', 'toggle');

    const content = document.createElement('div');
    content.className = 'task-content';

    const titleEl = document.createElement('p');
    titleEl.className = 'task-title';
    titleEl.textContent = task.title;

    content.appendChild(titleEl);

    if (task.desc && task.desc.trim().length > 0) {
      const descEl = document.createElement('p');
      descEl.className = 'task-desc';
      descEl.textContent = task.desc;
      content.appendChild(descEl);
    }

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.setAttribute('data-action', 'delete');

    actions.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(content);
    li.appendChild(actions);

    listEl.appendChild(li);
  }
}

/**
 * Wire up all UI events and delegate actions to callbacks.
 * @param {Object} handlers
 * @param {Function} handlers.onAddTask
 * @param {Function} handlers.onToggleTask
 * @param {Function} handlers.onDeleteTask
 * @param {Function} handlers.onFilterChange
 */
export function initUI({ onAddTask, onToggleTask, onDeleteTask, onFilterChange }) {
  const form = document.getElementById('task-form');
  const titleInput = document.getElementById('task-title');
  const descInput = document.getElementById('task-desc');
  const listEl = document.getElementById('task-list');
  const filterButtons = document.querySelectorAll('.filter-btn');

  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const title = titleInput.value.trim();
      const desc = descInput.value.trim();

      if (!title) return;

      onAddTask({ title, desc });

      form.reset();
      titleInput.focus();
    });
  }

  if (listEl) {
    listEl.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const li = target.closest('.task-item');
      if (!li) return;
      const id = li.dataset.id;
      if (!id) return;

      const action = target.getAttribute('data-action');
      if (action === 'toggle') {
        onToggleTask(id);
      } else if (action === 'delete') {
        onDeleteTask(id);
      }
    });
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');
      if (!filter) return;
      filterButtons.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      onFilterChange(filter);
    });
  });
}

/**
 * Show a security-related message (used later).
 * @param {string} text
 */
export function setSecurityMessage(text) {
  const messageEl = document.getElementById('security-message');
  if (messageEl) {
    messageEl.textContent = text || '';
  }
}
