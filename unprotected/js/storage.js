// Handles persistence of tasks in localStorage

const STORAGE_KEY = 'secureTasks_v1';

/**
 * Load tasks from localStorage.
 * @returns {Array<{id:string,title:string,desc:string,completed:boolean}>}
 */
export function loadTasks() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (err) {
    console.warn('Failed to load tasks from localStorage', err);
    return [];
  }
}

/**
 * Save tasks array to localStorage.
 * @param {Array} tasks
 */
export function saveTasks(tasks) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.warn('Failed to save tasks to localStorage', err);
  }
}
