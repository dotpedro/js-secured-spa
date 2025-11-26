# Secure Tasks — JS Secured SPA (Ongoing Project)

This is an **ongoing project** exploring client-side security techniques in a vanilla JavaScript Single Page Application.

The goal is to build a small but realistic Todo-style SPA and secure it using concepts inspired by Jscrambler-like protections:

- 🔒 Code obfuscation (via `javascript-obfuscator`)
- 🛑 Anti-debugging & DevTools detection
- 🛡 DOM tampering detection
- 🔁 Self-defending runtime integrity checks
- 📦 Separate **unprotected** and **protected** builds

---

## 🚧 Project Status: Ongoing

This repo will continue to evolve as new protection layers, improvements, and documentation are added.

Screenshots & examples will be added here as the project grows.

### 📸 Demo Screenshot  
<img width="815" height="371" alt="image" src="https://github.com/user-attachments/assets/2548b9eb-6fab-4ad2-aa75-b9c914c7263a" />

---

## 🧩 Features

### ✅ Core App (Unprotected Version)
- Add tasks (title + optional description)
- Mark tasks as completed / active
- Delete tasks
- Filter: **All / Active / Completed**
- Persistent storage via `localStorage`
- Fully modular vanilla JS (no frameworks)

### 🔐 Security Layer
- **Anti-debugging:** detects DevTools via window-size heuristic + timing tricks
- **DOM Guard:** monitors critical elements, detects tampering
- **Self-Defending Code:** checks function integrity & halts app if modified
- **Obfuscation:** protected build using `javascript-obfuscator`

---

## 📁 Project Structure

```

js-secured-spa/
README.md
package.json

unprotected/
index.html
styles.css
js/
app.js
storage.js
ui.js
security/
antiDebug.js
domGuard.js
selfDefend.js

protected/
index.html
styles.css
js/
app.obf.js

docs/
EXPLAINER.md

````

---

## 🔧 Build & Run

### Run Unprotected Version
```bash
npx http-server unprotected
````

Visit: [http://localhost:8080](http://localhost:8080)

### Build Protected Version

```bash
npm run build
```

Obfuscated file will be output to:

```
protected/js/app.obf.js
```

### Run Protected Version

```bash
npx http-server protected -p 8081
```

Visit: [http://localhost:8081](http://localhost:8081)

---

## 📘 Documentation

See `docs/EXPLAINER.md` for:

* Architecture overview
* Security techniques
* Debugging pitfalls
* Notes for developers
