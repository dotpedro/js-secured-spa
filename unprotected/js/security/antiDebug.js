// unprotected/js/security/antiDebug.js
// Simple anti-debugging module.
//
// Idea:
// 1) Check window size to guess if DevTools is open.
// 2) Use a timing trick with `debugger` to detect a pause.
// If we think DevTools is open, we call onDetected() once.

const DETECTION_INTERVAL_MS = 3000; // every 3 seconds
const SIZE_THRESHOLD = 160;         // pixels

// Heuristic 1: devtools often shrinks inner window compared to outer.
function isDevToolsOpenBySize() {
  const widthDiff = window.outerWidth - window.innerWidth;
  const heightDiff = window.outerHeight - window.innerHeight;

  return widthDiff > SIZE_THRESHOLD || heightDiff > SIZE_THRESHOLD;
}

// Heuristic 2: if devtools is open and paused on `debugger`, time jumps.
function isDevToolsOpenByTiming() {
  const start = performance.now();

  // If DevTools is open and you have "pause on debugger" enabled,
  // execution will stop here until the user resumes.
  debugger;

  const end = performance.now();
  const delta = end - start;

  // If the pause was long (e.g. > 100ms), we assume debugging.
  return delta > 100;
}

export function startAntiDebug({ onDetected } = {}) {
  console.log('[antiDebug] Anti-debugging initialized');

  let alreadyDetected = false;
  let intervalId = null;

  function triggerDetection(reason) {
    if (alreadyDetected) return;
    alreadyDetected = true;

    console.warn('[antiDebug] DevTools detected via:', reason);

    // Stop further checks
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }

    // Notify app.js
    if (typeof onDetected === 'function') {
      onDetected(reason);
    }
  }

  function runChecks() {
    try {
      if (isDevToolsOpenBySize()) {
        triggerDetection('window-size-heuristic');
        return;
      }

      if (isDevToolsOpenByTiming()) {
        triggerDetection('timing-debugger-heuristic');
        return;
      }
    } catch (err) {
      console.warn('[antiDebug] Error during detection', err);
    }
  }

  // Run once on startup
  runChecks();

  // Keep checking periodically
  intervalId = window.setInterval(() => {
    if (!alreadyDetected) {
      runChecks();
    }
  }, DETECTION_INTERVAL_MS);
}
