// unprotected/js/security/selfDefend.js
// Self-defending JavaScript.
//
// Idea:
// - We pick an internal function (checkIntegrity).
// - On startup, we compute a simple hash of its source code (toString()).
// - Every few seconds we recompute the hash.
// - If it changes, we assume someone modified the code in DevTools and we call onFail().
//
// This is NOT crypto-strong; it's just to demonstrate the concept.

const SELFDEFEND_CHECK_INTERVAL_MS = 4000;

// Very simple hash: sum of char codes.
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash + str.charCodeAt(i)) >>> 0; // keep it as 32-bit unsigned
  }
  return hash;
}

// This function is our "protected" target.
// We don't care what it does; we only care about its source text.
function checkIntegrity() {
  // This comment is part of the protected source.
  // Changing this function in DevTools should trigger the self-defend logic.
  return 'ok';
}

export function startSelfDefend({ onFail } = {}) {
  console.log('[selfDefend] Self-defend initialized');

  // Take the original snapshot of the function source
  const originalSource = checkIntegrity.toString();
  const originalHash = simpleHash(originalSource);

  // Expose a handle on window ONLY for demo/testing purposes.
  // An attacker could try to modify this function via DevTools.
  // In a real app, you probably wouldn't expose this.
  window.__selfDefendInfo = {
    targetFn: checkIntegrity,
    originalHash
  };

  let alreadyFailed = false;
  let intervalId = null;

  function triggerFail(reason) {
    if (alreadyFailed) return;
    alreadyFailed = true;

    console.warn('[selfDefend] Integrity failure detected. Reason:', reason);

    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }

    if (typeof onFail === 'function') {
      onFail(reason);
    }
  }

  function runCheck() {
    try {
      const info = window.__selfDefendInfo;
      const currentFn = info?.targetFn || checkIntegrity;

      const currentSource = currentFn.toString();
      const currentHash = simpleHash(currentSource);

      if (currentHash !== originalHash) {
        triggerFail('function-source-changed');
      }
    } catch (err) {
      console.warn('[selfDefend] Error during integrity check', err);
    }
  }

  // Initial check
  runCheck();

  // Periodic checks
  intervalId = window.setInterval(() => {
    if (!alreadyFailed) {
      runCheck();
    }
  }, SELFDEFEND_CHECK_INTERVAL_MS);
}
