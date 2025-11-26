# Secure Tasks – Protection Explainer

## 1. Project Overview

**Project name:** `js-secured-spa`  
**App name:** **Secure Tasks**

Secure Tasks is a tiny single-page Todo app written in vanilla JavaScript. It lets users:

- Add tasks (title + optional description)
- Mark tasks as completed / not completed
- Delete tasks
- Filter tasks by **All / Active / Completed**
- Persist tasks in `localStorage` so they survive page refreshes

The main goal of this project is **not** the Todo app itself, but to demonstrate client-side protection techniques similar to what tools like Jscrambler offer:

- Code obfuscation
- Anti-debugging
- DOM tampering detection
- Self-defending JavaScript

There are two runnable versions:

- `unprotected/` – readable, modular, easy to understand and debug
- `protected/` – same functionality, but shipped as a single obfuscated JS bundle

---

## 2. Architecture

### 2.1 Folder structure

```text
js-secured-spa/
  README.md
  package.json
  build.js

  unprotected/
    index.html
    styles.css
    js/
      app.js          // main app logic & initialization
      storage.js      // localStorage persistence
      ui.js           // DOM rendering & event binding
      security/
        antiDebug.js  // anti-debugging checks
        domGuard.js   // DOM tampering detection
        selfDefend.js // self-defending JavaScript logic

  protected/
    index.html        // same UI, loads obfuscated bundle
    styles.css        // same CSS as unprotected
    js/
      app.obf.js      // obfuscated + merged JS output

  docs/
    EXPLAINER.md      // this document
````

### 2.2 Module responsibilities

* **`storage.js`**

  * Reads and writes the task list to `localStorage`.
  * Exposes two functions:

    * `loadTasks()`
    * `saveTasks(tasks)`

* **`ui.js`**

  * Renders tasks into the DOM based on the current filter.
  * Wires UI events:

    * Form submission (add task)
    * Checkbox clicks (toggle completion)
    * Delete button clicks
    * Filter button clicks
  * Exposes:

    * `renderTasks(tasks, filter)`
    * `initUI(handlers)`
    * `setSecurityMessage(text)`

* **`app.js`**

  * Orchestrates everything:

    * Loads tasks from `storage.js`
    * Keeps the in-memory `tasks` array and current filter
    * Calls `renderTasks` whenever data changes
    * Initializes the three security modules and defines how to “lock” the app:

      * `startAntiDebug()`
      * `startDomGuard()`
      * `startSelfDefend()`

* **`security/antiDebug.js`**

  * Periodically checks for DevTools usage.
  * When detection is triggered, calls `onDetected()` (provided by `app.js`).

* **`security/domGuard.js`**

  * Takes a snapshot of critical DOM elements on startup.
  * Periodically checks if they still exist and have a similar text structure.
  * If something looks heavily modified or removed, calls `onTamper()`.

* **`security/selfDefend.js`**

  * Stores a hash of its own function’s source code (via `toString()`).
  * Periodically recomputes the hash and compares.
  * If the code appears modified (e.g. via DevTools), calls `onFail()`.

### 2.3 Initialization Flow

On page load (`unprotected/index.html`):

1. **HTML loads** and includes:

   ```html
   <script type="module" src="./js/app.js"></script>
   ```

2. `app.js` runs when `DOMContentLoaded` fires:

   * `tasks = loadTasks()` from `storage.js`
   * `initUI({...})` from `ui.js` to connect event handlers
   * `renderTasks(tasks, 'all')` to draw the initial list

3. Security modules are started:

   ```js
   startAntiDebug({
     onDetected: () => lockApp('Debugging detected. App locked.')
   });

   startDomGuard({
     onTamper: () => lockApp('DOM tampering detected. App locked.')
   });

   startSelfDefend({
     onFail: () => lockApp('Integrity check failed. App locked.')
   });
   ```

4. `lockApp(message)` shows a security message and disables interactions:

   * Security message displayed in the UI
   * Form is dimmed and disabled
   * All buttons are disabled

---

## 3. Protection Techniques

### 3.1 Code Obfuscation

**Tool:** [`javascript-obfuscator`](https://github.com/javascript-obfuscator/javascript-obfuscator)
**Build script:** `build.js` (run via `npm run build`)

**Process:**

1. All JavaScript files under `unprotected/js` are concatenated in a specific order:

   * `storage.js`
   * `ui.js`
   * `security/antiDebug.js`
   * `security/domGuard.js`
   * `security/selfDefend.js`
   * `app.js`
2. ES module syntax is stripped:

   * `import ...` lines are removed.
   * `export function` is replaced with `function`.
3. The resulting bundle is passed through `javascript-obfuscator` with an aggressive configuration:

   * `compact: true`
   * `controlFlowFlattening: true`
   * `deadCodeInjection: true`
   * `stringArray: true`, `stringArrayRotation: true`, etc.
4. Output is written as:

   * `protected/js/app.obf.js`

In `protected/index.html`, only this one script is loaded:

```html
<script src="./js/app.obf.js"></script>
```

**Effects of obfuscation:**

* Variable and function names become meaningless.
* Control flow is transformed with additional branching and junk paths.
* Strings are moved into arrays and accessed indirectly.
* The resulting code is hard to read and debug, even if the attacker prettifies it.

---

### 3.2 Anti-Debugging (`security/antiDebug.js`)

**Goals:**

* Detect when browser DevTools is open and active.
* React by locking the app and/or making the experience painful for an attacker.

**Techniques used:**

1. **Window size heuristic**

   ```js
   const widthDiff = window.outerWidth - window.innerWidth;
   const heightDiff = window.outerHeight - window.innerHeight;
   ```

   When DevTools is docked, the visible inner window often shrinks. If the difference exceeds a threshold, we assume DevTools is open.

2. **Timing + `debugger` heuristic**

   A function measures time around a `debugger` statement:

   ```js
   const start = performance.now();
   debugger;
   const end = performance.now();
   const delta = end - start;
   ```

   If DevTools is configured to pause on `debugger`, the execution stops, and the measured time jumps. A large `delta` is treated as a debugging attempt.

**Execution strategy:**

* Checks run:

  * Once at startup.
  * Repeatedly on a timer (e.g. every ~3 seconds).

**Response:**

* When detection triggers, `onDetected(reason)` is called.
* `app.js` then calls `lockApp('Debugging detected. App locked.')`:

  * Displays a warning message.
  * Disables the main form and buttons.

---

### 3.3 DOM Tampering Detection (`security/domGuard.js`)

**Goals:**

* Protect key DOM elements from being removed or drastically changed by someone using DevTools or scripts in the console.

**Protected elements (example selectors):**

* `.app-main` (main container)
* `#task-form` (add-task form)
* `.task-filters` (filter buttons)
* `#task-list` (task list container)

**How it works:**

1. **Snapshot phase (on initialization):**

   For each protected selector, the module records:

   * Whether the element exists.
   * A simple metric of its content: length of `textContent`.

2. **Periodic checks (every few seconds):**

   * If an element that previously existed no longer exists → tampering.
   * If the length of the text content changes by a large factor → tampering.

     * This is a crude “checksum” to detect aggressive modifications.

3. **Response:**

   * On tamper detection, `onTamper(reason)` is called.
   * `app.js` calls `lockApp('DOM tampering detected. App locked.')`.

This does **not** try to be perfect or cryptographically secure; it just quickly detects basic “I removed the form” or “I replaced everything with HACKED!!!” modifications.

---

### 3.4 Self-Defending Code (`security/selfDefend.js`)

**Goals:**

* Detect when the JavaScript itself has been modified in runtime (e.g., someone changes a function using DevTools).
* React by locking the app when integrity is compromised.

**Core idea:**

1. A function `checkIntegrity()` is defined inside `selfDefend.js`.
2. On startup:

   * Its `toString()` representation is read.
   * A very simple hash (sum of char codes) is calculated and stored.
3. A reference and the original hash are stored on `window.__selfDefendInfo` (for testing/demonstration).
4. Every few seconds:

   * The current `toString()` of the target function is taken.
   * The hash is recomputed.
   * If the hash differs from the original, integrity is considered broken.

**Example attack scenario:**

In the browser console:

```js
window.__selfDefendInfo.targetFn = function hacked() {
  return 'hacked!';
};
```

On the next check:

* The hash changes.
* `onFail('function-source-changed')` is called.
* `app.js` calls `lockApp('Integrity check failed. App locked.')`.

In the obfuscated version (`protected/js/app.obf.js`), this logic is heavily transformed, making it much harder to identify and modify safely.

---

## 4. Common Debugging Pitfalls

### 4.1 Obfuscated code is hard to read

When working with `protected/js/app.obf.js`:

* Variable and function names are meaningless.
* Flow control is convoluted due to control flow flattening.
* Strings are hidden behind array lookups.
* There may be injected dead code that never runs but confuses analysis.

Even with pretty-print in DevTools, it’s difficult to map code back to the original logic.

### 4.2 Anti-debugging can break “normal” inspection

A support engineer opening DevTools will trigger:

* Window size checks
* `debugger` timing checks

This can:

* Lock the app.
* Clear or disable the UI.
* Make debugging sessions unreliable or short-lived.

### 4.3 DOM guard fights with DOM-based debugging

Typical debug techniques like:

* Removing UI elements
* Replacing text for testing
* Temporarily hiding containers

may be interpreted as tampering, causing the DOM guard to lock the app.

### 4.4 Self-defending code can break patch-based debugging

If an engineer tries to:

* Patch a function at runtime.
* Monkey-patch security logic in the console.
* Inject new behavior by overwriting existing functions.

the self-defending mechanism can detect that and lock the app, making it harder to test quick fixes directly in the browser.

---

## 5. Debugging & Support Recommendations

### 5.1 Always start with the unprotected version

For troubleshooting:

1. Reproduce the issue in `unprotected/index.html`:

   * Clear `localStorage` for a clean state if needed.
2. Use clear module separation (`storage.js`, `ui.js`, `app.js`) to:

   * Add `console.log` calls in readable code.
   * Step through with DevTools without triggering anti-debug logic.

Once fixed, rebuild:

```bash
npm run build
```

and re-test:

```bash
npx http-server protected -p 8081
```

### 5.2 Compare behaviors between unprotected and protected

If something only breaks in the protected version:

* Check for build issues:

  * Missing files in the bundle order.
  * Incorrect `import`/`export` stripping.
* Look for load-order or CSP problems:

  * Are scripts allowed by CSP headers?
  * Is the obfuscated bundle actually being loaded (no 404)?

### 5.3 Use console logs carefully

Because obfuscation changes code structure:

* Line numbers might not match the original.
* Some logs may be optimized away or buried.

Best practice:

* Log in the **unprotected** code.
* Confirm everything works there.
* Then verify only that **overall behavior** matches in the protected build.

### 5.4 Be aware of security layers when debugging

* **Anti-debugging**

  * May need to be temporarily disabled in `unprotected/js/security/antiDebug.js` or in `app.js` during development.
* **DOM guard**

  * Avoid manually deleting or heavily editing protected nodes while testing UI.
* **Self-defending**

  * Don’t modify functions at runtime during investigation unless you intentionally disable self-defend for that session.

---

## 6. Summary

Secure Tasks is a small Todo SPA designed to show how client-side JavaScript can be hardened:

* **Code obfuscation** makes the bundle hard to read or reverse engineer.
* **Anti-debugging** detects when DevTools are open and reacts.
* **DOM tampering detection** monitors critical UI elements and locks the app on suspicious changes.
* **Self-defending code** keeps a simple integrity check on its own source and reacts to modification.

For real-world support and maintenance, engineers should rely on the **unprotected** version for clarity, and treat the **protected** version as a production build where protections are active and expected to interfere with casual debugging and tampering attempts.

