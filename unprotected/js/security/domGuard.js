// unprotected/js/security/domGuard.js
// DOM tampering detection.
//
// Idea:
// - On startup, we "snapshot" some critical elements:
//   * Do they exist?
//   * Rough size of their text content.
// - Every few seconds we re-check.
// - If something important disappears or is radically changed,
//   we call onTamper() once.

const CHECK_INTERVAL_MS = 3000; // every 3s
const TEXT_CHANGE_FACTOR = 3;   // allow some change, but not huge

// Which DOM nodes we care about
const PROTECTED_SELECTORS = [
  '.app-main',      // main app container
  '#task-form',     // form to add tasks
  '.task-filters',  // filter buttons
  '#task-list'      // list of tasks
];

/**
 * Take a simple snapshot of protected elements.
 * We don't need crypto here; just a rough "shape" of the DOM.
 */
function snapshotDom() {
  const snapshot = [];

  for (const selector of PROTECTED_SELECTORS) {
    const el = document.querySelector(selector);

    snapshot.push({
      selector,
      exists: !!el,
      textLength: el ? (el.textContent || '').length : 0
    });
  }

  return snapshot;
}

/**
 * Compare current DOM with the initial snapshot.
 * @returns {boolean} true if we think tampering happened
 */
function isTampered(initialSnapshot) {
  for (const item of initialSnapshot) {
    const el = document.querySelector(item.selector);

    // If an element that originally existed is now missing → suspicious
    if (item.exists && !el) {
      console.warn('[domGuard] Element disappeared:', item.selector);
      return true;
    }

    if (item.exists && el) {
      const currentTextLength = (el.textContent || '').length;

      // If text content changed by a large factor, we consider it tampered.
      const maxLen = Math.max(1, item.textLength);
      const ratio =
        currentTextLength > maxLen
          ? currentTextLength / maxLen
          : maxLen / Math.max(1, currentTextLength);

      if (ratio > TEXT_CHANGE_FACTOR) {
        console.warn(
          '[domGuard] Element text length changed a lot:',
          item.selector,
          'initial =',
          item.textLength,
          'current =',
          currentTextLength
        );
        return true;
      }
    }
  }

  return false;
}

export function startDomGuard({ onTamper } = {}) {
  console.log('[domGuard] DOM guard initialized');

  const initialSnapshot = snapshotDom();
  let alreadyTriggered = false;
  let intervalId = null;

  function triggerTamper(reason) {
    if (alreadyTriggered) return;
    alreadyTriggered = true;

    console.warn('[domGuard] Tampering detected. Reason:', reason);

    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }

    if (typeof onTamper === 'function') {
      onTamper(reason);
    }
  }

  function runCheck() {
    try {
      if (isTampered(initialSnapshot)) {
        triggerTamper('snapshot-mismatch');
      }
    } catch (err) {
      console.warn('[domGuard] Error during DOM check', err);
    }
  }

  // Initial check (in case something already messed with the DOM)
  runCheck();

  // Periodic checks
  intervalId = window.setInterval(() => {
    if (!alreadyTriggered) {
      runCheck();
    }
  }, CHECK_INTERVAL_MS);
}
