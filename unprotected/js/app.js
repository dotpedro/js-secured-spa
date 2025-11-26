// Main application logic for Secure Tasks.

import { loadTasks, saveTasks } from './storage.js';
import { initUI, renderTasks, setSecurityMessage } from './ui.js';
import { startAntiDebug } from './security/antiDebug.js';
import { startDomGuard } from './security/domGuard.js';
import { startSelfDefend } from './security/selfDefend.js';

let tasks = [];
let currentFilter = 'all';

/**
 * Create a new task object.
 */
function createTask({ title, desc }) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + '_' + Math.random(),
    title,
    desc,
    completed: false
  };
}

function addTask({ title, desc }) {
  const newTask = createTask({ title, desc });
  tasks = [newTask, ...tasks];
  saveTasks(tasks);
  renderTasks(tasks, currentFilter);
}

function toggleTask(id) {
  tasks = tasks.map(task =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );
  saveTasks(tasks);
  renderTasks(tasks, currentFilter);
}

function deleteTask(id) {
  tasks = tasks.filter(task => task.id !== id);
  saveTasks(tasks);
  renderTasks(tasks, currentFilter);
}

function setFilter(filter) {
  currentFilter = filter;
  renderTasks(tasks, currentFilter);
}

function lockApp(message) {
  setSecurityMessage(message);

  // Disable the task form
  const form = document.getElementById('task-form');
  if (form) {
    form.style.opacity = '0.5';
    form.style.pointerEvents = 'none';
  }

  // Disable all buttons (add, filters, delete)
  const buttons = document.querySelectorAll('button');
  buttons.forEach((btn) => {
    btn.disabled = true;
  });

  console.warn('[app] App locked due to security event:', message);
}


function init() {
  console.log('[app] Initializing Secure Tasks');

  tasks = loadTasks();

  initUI({
    onAddTask: addTask,
    onToggleTask: toggleTask,
    onDeleteTask: deleteTask,
    onFilterChange: setFilter
  });

  renderTasks(tasks, currentFilter);

  // Security (still stubs)
  /*
  startAntiDebug({
    onDetected: () => {
      lockApp('Debugging detected. App locked.');
    }
  });
  */

  startDomGuard({
    onTamper: () => {
      lockApp('DOM tampering detected. App locked.');
    }
  });

  startSelfDefend({
    onFail: () => {
      lockApp('Integrity check failed. App locked.');
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
