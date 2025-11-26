// build.js
// Simple build script to:
// 1) Concatenate unprotected JS files in the right order
// 2) Strip ES module import/export keywords
// 3) Obfuscate the result into protected/js/app.obf.js

const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

// 1. Files to bundle, in order
const filesInOrder = [
  'unprotected/js/storage.js',
  'unprotected/js/ui.js',
  'unprotected/js/security/antiDebug.js',
  'unprotected/js/security/domGuard.js',
  'unprotected/js/security/selfDefend.js',
  'unprotected/js/app.js'
];

function readFile(p) {
  const fullPath = path.join(__dirname, p);
  return fs.readFileSync(fullPath, 'utf8');
}

// 2. Very small "bundler": remove import lines and `export` keywords
function makeBundle() {
  let bundle = '';

  for (const relPath of filesInOrder) {
    let code = readFile(relPath);

    // Remove ES module import lines
    code = code
      .split('\n')
      .filter(line => !line.trim().startsWith('import '))
      .join('\n');

    // Turn `export function` into plain `function`
    code = code.replace(/export\s+function/g, 'function');

    // If you had `export const` you could also handle here, but we don't.
    bundle += '\n\n// ---- ' + relPath + ' ----\n\n';
    bundle += code;
  }

  return bundle;
}

// 3. Obfuscation config
const obfuscatorOptions = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  stringArray: true,
  stringArrayThreshold: 0.75,
  stringArrayRotate: true,
  rotateStringArray: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersType: 'function',
  splitStrings: true,
  splitStringsChunkLength: 10,
  transformObjectKeys: true,
  numbersToExpressions: true,
  simplify: true,
  shuffleStringArray: true,
  renameGlobals: false // keep false to avoid breaking anything global
};

function build() {
  console.log('[build] Creating bundle from unprotected JS...');
  const bundleCode = makeBundle();

  console.log('[build] Bundle size (chars):', bundleCode.length);

  console.log('[build] Obfuscating...');
  const obfuscated = JavaScriptObfuscator.obfuscate(bundleCode, obfuscatorOptions);
  const outputCode = obfuscated.getObfuscatedCode();

  const outDir = path.join(__dirname, 'protected', 'js');
  const outFile = path.join(outDir, 'app.obf.js');

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outFile, outputCode, 'utf8');
  console.log('[build] Wrote obfuscated file to:', outFile);
}

build();
