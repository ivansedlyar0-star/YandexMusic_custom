#!/usr/bin/env node

/**
 * Yandex Music Enhancer - Cross-platform Patcher & Installer
 * Compatible with Linux, Windows, macOS
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';

function log(msg) {
  console.log(`${CYAN}[YMEnhancer]${RESET} ${msg}`);
}
function success(msg) {
  console.log(`${GREEN}✔ ${msg}${RESET}`);
}
function warn(msg) {
  console.log(`${YELLOW}⚠ ${msg}${RESET}`);
}
function error(msg) {
  console.error(`${RED}✖ ${msg}${RESET}`);
}

const INJECTION_TAG_START = '/* --- YANDEX MUSIC ENHANCER INJECTION START --- */';
const INJECTION_TAG_END = '/* --- YANDEX MUSIC ENHANCER INJECTION END --- */';

function getConfigDir(customConfigDir) {
  if (customConfigDir) return path.resolve(customConfigDir);
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'YandexMusic');
  } else if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'YandexMusic');
  } else {
    return path.join(os.homedir(), '.config', 'YandexMusic');
  }
}

function findAppAsar(customAppPath) {
  if (customAppPath) {
    const resolved = path.resolve(customAppPath);
    if (fs.existsSync(resolved)) {
      if (fs.statSync(resolved).isDirectory()) {
        const asarInside = path.join(resolved, 'resources', 'app.asar');
        if (fs.existsSync(asarInside)) return asarInside;
        const directAsar = path.join(resolved, 'app.asar');
        if (fs.existsSync(directAsar)) return directAsar;
      }
      return resolved;
    }
  }

  const candidates = [];
  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
    const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

    candidates.push(
      path.join(localAppData, 'Programs', 'YandexMusic', 'resources', 'app.asar'),
      path.join(programFiles, 'YandexMusic', 'resources', 'app.asar'),
      path.join(programFilesX86, 'YandexMusic', 'resources', 'app.asar'),
      path.join(localAppData, 'YandexMusic', 'resources', 'app.asar')
    );
  } else if (process.platform === 'darwin') {
    candidates.push(
      '/Applications/Yandex Music.app/Contents/Resources/app.asar',
      path.join(os.homedir(), 'Applications', 'Yandex Music.app', 'Contents', 'Resources', 'app.asar')
    );
  } else {
    // Linux
    candidates.push(
      path.join(os.homedir(), '.local', 'share', 'yandex-music', 'resources', 'app.asar'),
      '/opt/yandex-music/resources/app.asar',
      '/usr/lib/yandex-music/resources/app.asar',
      '/usr/share/yandex-music/resources/app.asar',
      path.join(os.homedir(), '.local', 'share', 'flatpak', 'app', 'ru.yandex.YandexMusic', 'current', 'active', 'files', 'yandex-music', 'resources', 'app.asar'),
      '/var/lib/flatpak/app/ru.yandex.YandexMusic/current/active/files/yandex-music/resources/app.asar'
    );
  }

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function getIndexInjection() {
  return `
${INJECTION_TAG_START}
function setupYmEnhancer(win) {
  const fs = require('fs');
  const os = require('os');
  const path = require('path');
  const { spawn } = require('child_process');

  const getConfigDir = () => {
    if (process.platform === 'win32') {
      return path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'YandexMusic');
    } else if (process.platform === 'darwin') {
      return path.join(os.homedir(), 'Library', 'Application Support', 'YandexMusic');
    } else {
      return path.join(os.homedir(), '.config', 'YandexMusic');
    }
  };

  const configDir = getConfigDir();
  const cssPath = path.join(configDir, 'custom.css');
  const themeJsonPath = path.join(configDir, 'theme.json');
  const caelestiaScheme = path.join(os.homedir(), '.local', 'state', 'caelestia', 'scheme.json');
  const caelestiaFont = path.join(os.homedir(), '.config', 'caelestia', 'shell.json');
  const pywalColors = path.join(os.homedir(), '.cache', 'wal', 'colors.json');

  const hexToRgb = (hex, def = [15, 12, 15]) => {
    if (!hex) return def;
    hex = hex.replace('#', '');
    if (hex.length === 6) {
      return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
    }
    return def;
  };

  const injectStyles = () => {
    try {
      let font = 'YS Text, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
      let primary = '#ebbf89';
      let primaryFixed = '#f2cf9e';
      let bgHex = '050301';
      let surfHex = '0a0603';
      let textHex = '#f4e3d1';
      let subtextHex = '#b8a999';
      let outlineHex = '#817365';

      if (fs.existsSync(themeJsonPath)) {
        try {
          const t = JSON.parse(fs.readFileSync(themeJsonPath, 'utf8'));
          if (t.font) font = t.font;
          if (t.colors) {
            if (t.colors.primary) primary = t.colors.primary;
            if (t.colors.primaryHover) primaryFixed = t.colors.primaryHover;
            if (t.colors.background) bgHex = t.colors.background;
            if (t.colors.surface) surfHex = t.colors.surface;
            if (t.colors.text) textHex = t.colors.text;
            if (t.colors.subtext) subtextHex = t.colors.subtext;
            if (t.colors.outline) outlineHex = t.colors.outline;
          }
        } catch (e) {}
      } else if (fs.existsSync(caelestiaScheme)) {
        try {
          const sc = JSON.parse(fs.readFileSync(caelestiaScheme, 'utf8')).colours || {};
          if (sc.primary) primary = '#' + sc.primary;
          if (sc.primaryFixed) primaryFixed = '#' + sc.primaryFixed; else primaryFixed = primary;
          if (sc.background) bgHex = sc.background;
          if (sc.surface) surfHex = sc.surface;
          if (sc.text) textHex = '#' + sc.text;
          if (sc.subtext1) subtextHex = '#' + sc.subtext1;
          if (sc.outline) outlineHex = '#' + sc.outline;
          if (fs.existsSync(caelestiaFont)) {
            const fd = JSON.parse(fs.readFileSync(caelestiaFont, 'utf8'));
            if (fd && fd.appearance && fd.appearance.font && fd.appearance.font.body && fd.appearance.font.body.family) {
              font = fd.appearance.font.body.family;
            }
          }
        } catch (e) {}
      } else if (fs.existsSync(pywalColors)) {
        try {
          const pw = JSON.parse(fs.readFileSync(pywalColors, 'utf8'));
          if (pw.colors && pw.colors.color1) primary = pw.colors.color1;
          if (pw.colors && pw.colors.color3) primaryFixed = pw.colors.color3;
          if (pw.special && pw.special.background) bgHex = pw.special.background;
          if (pw.special && pw.special.foreground) textHex = pw.special.foreground;
        } catch (e) {}
      }

      const [rBg, gBg, bBg] = hexToRgb(bgHex, [5, 3, 1]);
      const [rSurf, gSurf, bSurf] = hexToRgb(surfHex, [10, 6, 3]);

      let customCss = '';
      if (fs.existsSync(cssPath)) {
        try {
          customCss = fs.readFileSync(cssPath, 'utf8');
        } catch (e) {}
      }

      const fullCss = \`
        @font-face { font-family: 'YS Text'; src: local('\${font}'); }
        @font-face { font-family: 'YSMusic Headline'; src: local('\${font}'); }
        :root {
          --g-font-family-sans: '\${font}', sans-serif !important;
          --g-text-body-font-family: '\${font}', sans-serif !important;
          --g-text-caption-font-family: '\${font}', sans-serif !important;
          --g-text-display-font-family: '\${font}', sans-serif !important;
          --g-text-header-font-family: '\${font}', sans-serif !important;
          --g-text-subheader-font-family: '\${font}', sans-serif !important;
          --ym-font-family-text: '\${font}', sans-serif !important;
          --ym-font-heading: '\${font}', sans-serif !important;
          --ym-font-text: '\${font}', sans-serif !important;

          --sys-primary: \${primary} !important;
          --sys-primary-hover: \${primaryFixed} !important;
          --sys-text: \${textHex} !important;
          --sys-subtext: \${subtextHex} !important;
          --sys-outline: \${outlineHex} !important;
          --sys-glass-bg: rgba(\${rBg}, \${gBg}, \${bBg}, 0.70) !important;
          --sys-glass-surface: rgba(\${rSurf}, \${gSurf}, \${bSurf}, 0.60) !important;
          --sys-glass-player: rgba(\${rSurf}, \${gSurf}, \${bSurf}, 0.75) !important;
          --sys-glass-popover: rgba(\${rSurf}, \${gSurf}, \${bSurf}, 0.85) !important;

          --ym-background-color-primary-enabled-basic: rgba(\${rBg}, \${gBg}, \${bBg}, 0.70) !important;
          --ym-background-color-primary-enabled-content: transparent !important;
          --ym-background-color-primary-enabled-header: rgba(\${rSurf}, \${gSurf}, \${bSurf}, 0.60) !important;
          --ym-background-color-primary-enabled-player: rgba(\${rSurf}, \${gSurf}, \${bSurf}, 0.75) !important;
          --ym-background-color-primary-enabled-popover: rgba(\${rSurf}, \${gSurf}, \${bSurf}, 0.85) !important;
          --ym-background-color-primary-enabled-menu: rgba(\${rSurf}, \${gSurf}, \${bSurf}, 0.85) !important;

          --ym-controls-color-primary-default-enabled: \${primary} !important;
          --ym-controls-color-primary-default-hovered: \${primaryFixed} !important;
          --ym-controls-color-primary-outline-selected_stroke: \${primary} !important;
          --ym-slider-color-primary-enabled: \${primary} !important;
          --ym-slider-color-primary-progress: \${primary} !important;
          --ym-logo-color-primary-variant: \${primary} !important;
          --ym-logo-color-primary-player: \${primary} !important;
          --ym-logo-color-primary-text: \${primary} !important;
          --text-color-accent: \${primary} !important;
        }
        body, button, input, textarea, select, a, h1, h2, h3, h4, h5, h6, label {
          font-family: '\${font}', sans-serif !important;
        }
        *:not([class*="icon" i]):not([class*="Icon"]):not(svg):not(path) {
          font-family: '\${font}', sans-serif !important;
        }
        \${customCss}
      \`;

      if (win && win.webContents && !win.webContents.isDestroyed()) {
        win.webContents.insertCSS(fullCss);
      }
    } catch (e) {
      console.warn('[Enhancer] CSS injection error:', e);
    }
  };

  win.webContents.on('did-finish-load', injectStyles);
  win.webContents.on('dom-ready', injectStyles);

  try {
    if (fs.existsSync(cssPath)) fs.watchFile(cssPath, { interval: 800 }, injectStyles);
    if (fs.existsSync(themeJsonPath)) fs.watchFile(themeJsonPath, { interval: 800 }, injectStyles);
    if (fs.existsSync(caelestiaScheme)) fs.watchFile(caelestiaScheme, { interval: 800 }, injectStyles);
  } catch (e) {}

  let cavaProc = null;
  const isWindows = process.platform === 'win32';
  const cavaBin = isWindows ? 'cava.exe' : (fs.existsSync('/usr/bin/cava') ? '/usr/bin/cava' : 'cava');

  try {
    const cavaTmpConf = path.join(os.tmpdir(), 'ym_cava_desktop.conf');
    const inputMethod = isWindows ? 'wasapi' : 'pulse';
    const conf = [
      '[general]',
      'bars = 64',
      'framerate = 60',
      '[input]',
      \`method = \${inputMethod}\`,
      'source = auto',
      '[output]',
      'method = raw',
      'raw_target = /dev/stdout',
      'data_format = ascii',
      'ascii_max_range = 100',
      'bar_delimiter = 59',
      'frame_delimiter = 10',
      '[smoothing]',
      'noise_reduction = 70',
      'monstercat = 1',
      'gravity = 110',
      ''
    ].join('\\n');
    fs.writeFileSync(cavaTmpConf, conf, 'utf8');

    cavaProc = spawn(cavaBin, ['-p', cavaTmpConf], { stdio: ['ignore', 'pipe', 'ignore'] });
    let buf = '';
    cavaProc.stdout.on('data', (chunk) => {
      buf += chunk.toString('utf8');
      const lines = buf.split('\\n');
      buf = lines.pop();
      for (const line of lines) {
        if (!line.trim()) continue;
        const vals = line.split(';').filter(Boolean).map(Number);
        if (vals.length > 0 && !win.isDestroyed()) {
          win.webContents.send('ym-cava-stream', vals);
        }
      }
    });
    cavaProc.on('error', () => {});
  } catch (e) {}

  win.on('closed', () => {
    if (cavaProc) {
      try { cavaProc.kill(); } catch (e) {}
    }
  });
}

try {
  const electronMod = require('electron');
  electronMod.ipcMain.on('get-audio-hub-script', (event) => {
    const fs = require('fs');
    const os = require('os');
    const path = require('path');
    const configDir = process.platform === 'win32'
      ? path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'YandexMusic')
      : (process.platform === 'darwin'
          ? path.join(os.homedir(), 'Library', 'Application Support', 'YandexMusic')
          : path.join(os.homedir(), '.config', 'YandexMusic'));
    const hubScript = path.join(configDir, 'audio_hub.js');
    try {
      event.returnValue = fs.readFileSync(hubScript, 'utf8');
    } catch (e) {
      event.returnValue = '';
    }
  });
} catch (e) {}
${INJECTION_TAG_END}
`;
}

function getPreloadInjection() {
  return `
${INJECTION_TAG_START}
(() => {
  try {
    const code = electron.ipcRenderer.sendSync('get-audio-hub-script');
    if (code) {
      const fn = new Function('window', 'document', code);
      fn(window, document);
      if (typeof window.initAudioHub === 'function') {
        window.initAudioHub();
      }
    }
  } catch (e) {
    console.warn('[Enhancer] Failed to load audio hub:', e);
  }

  try {
    electron.ipcRenderer.on('ym-cava-stream', (_event, data) => {
      window.postMessage({ type: 'ym-cava-data', data }, '*');
    });
  } catch (e) {}
})();
${INJECTION_TAG_END}
`;
}

function extractAsar(asarPath, destDir) {
  log(`Extracting ${asarPath} to temporary directory...`);
  try {
    execSync(`npx --yes asar extract "${asarPath}" "${destDir}"`, { stdio: 'inherit' });
  } catch (e) {
    throw new Error(`Failed to extract asar archive: ${e.message}`);
  }
}

function packAsar(srcDir, asarPath) {
  log(`Repacking modified files to ${asarPath}...`);
  try {
    execSync(`npx --yes asar pack "${srcDir}" "${asarPath}"`, { stdio: 'inherit' });
  } catch (e) {
    throw new Error(`Failed to pack asar archive: ${e.message}`);
  }
}

function patchFiles(unpackedDir) {
  const indexPath = path.join(unpackedDir, 'index.js');
  const preloadPath = path.join(unpackedDir, 'preload.js');

  if (!fs.existsSync(indexPath) || !fs.existsSync(preloadPath)) {
    throw new Error('Could not find index.js or preload.js inside extracted asar!');
  }

  log('Patching index.js...');
  let indexCode = fs.readFileSync(indexPath, 'utf8');

  // Strip previous injection if present
  if (indexCode.includes(INJECTION_TAG_START)) {
    const re = new RegExp(`${escapeRegex(INJECTION_TAG_START)}[\\s\\S]*?${escapeRegex(INJECTION_TAG_END)}`, 'g');
    indexCode = indexCode.replace(re, '');
    indexCode = indexCode.replace(/\n\s*setupYmEnhancer\(window\);/g, '');
  }

  // Hook setupYmEnhancer into window creation
  const windowCreationPattern = /const\s+window\s*=\s*await\s+createWindow\(\);/;
  if (windowCreationPattern.test(indexCode)) {
    indexCode = indexCode.replace(
      windowCreationPattern,
      'const window = await createWindow();\n  setupYmEnhancer(window);'
    );
  } else {
    // Fallback: hook inside handleWindowLifecycleEvents
    const lifecyclePattern = /const\s+handleWindowLifecycleEvents\s*=\s*\(window\)\s*=>\s*\{/;
    if (lifecyclePattern.test(indexCode)) {
      indexCode = indexCode.replace(
        lifecyclePattern,
        'const handleWindowLifecycleEvents = (window) => {\n  setupYmEnhancer(window);'
      );
    } else {
      warn('Could not find standard createWindow or handleWindowLifecycleEvents anchor in index.js, appending setup hook.');
    }
  }

  indexCode += '\n' + getIndexInjection();
  fs.writeFileSync(indexPath, indexCode, 'utf8');

  log('Patching preload.js...');
  let preloadCode = fs.readFileSync(preloadPath, 'utf8');

  // Strip previous injection if present
  if (preloadCode.includes(INJECTION_TAG_START)) {
    const re = new RegExp(`${escapeRegex(INJECTION_TAG_START)}[\\s\\S]*?${escapeRegex(INJECTION_TAG_END)}`, 'g');
    preloadCode = preloadCode.replace(re, '');
  }

  preloadCode += '\n' + getPreloadInjection();
  fs.writeFileSync(preloadPath, preloadCode, 'utf8');
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function install(options) {
  const asarPath = findAppAsar(options.appPath);
  if (!asarPath) {
    error('Could not find Yandex Music app.asar!');
    console.log('\nPlease specify the path using: --app-path <path to app.asar>');
    process.exit(1);
  }

  const configDir = getConfigDir(options.configPath);
  log(`Found application ASAR: ${BOLD}${asarPath}${RESET}`);
  log(`Target configuration directory: ${BOLD}${configDir}${RESET}`);

  // Create config directory
  fs.mkdirSync(configDir, { recursive: true });

  // Copy assets from src
  const repoRoot = path.resolve(__dirname, '..');
  const srcDir = path.join(repoRoot, 'src');

  const cssSrc = path.join(srcDir, 'custom.css');
  const hubSrc = path.join(srcDir, 'audio_hub.js');
  const themeSrc = path.join(srcDir, 'theme.json');

  const cssDest = path.join(configDir, 'custom.css');
  const hubDest = path.join(configDir, 'audio_hub.js');
  const themeDest = path.join(configDir, 'theme.json');

  log('Deploying enhancement scripts and styles...');
  if (fs.existsSync(cssSrc)) fs.copyFileSync(cssSrc, cssDest);
  if (fs.existsSync(hubSrc)) fs.copyFileSync(hubSrc, hubDest);
  if (fs.existsSync(themeSrc) && !fs.existsSync(themeDest)) fs.copyFileSync(themeSrc, themeDest);

  // Backup app.asar if orig doesn't exist
  const backupPath = asarPath + '.orig';
  if (!fs.existsSync(backupPath)) {
    log(`Creating safe backup at: ${backupPath}`);
    fs.copyFileSync(asarPath, backupPath);
  } else {
    log(`Safe backup already exists at: ${backupPath}`);
  }

  // Temporary unpacking directory
  const tmpDir = path.join(os.tmpdir(), `ym_enhancer_build_${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  try {
    extractAsar(asarPath, tmpDir);
    patchFiles(tmpDir);
    packAsar(tmpDir, asarPath);
    success('Yandex Music has been successfully patched with Enhancer v1.0.0!');
    log(`Restart Yandex Music to enjoy the new Glassmorphic theme & Audio Studio Hub.`);
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (e) {}
  }
}

function restore(options) {
  const asarPath = findAppAsar(options.appPath);
  if (!asarPath) {
    error('Could not find Yandex Music app.asar to restore!');
    process.exit(1);
  }

  const backupPath = asarPath + '.orig';
  if (!fs.existsSync(backupPath)) {
    error(`Original backup not found at ${backupPath}. Cannot restore.`);
    process.exit(1);
  }

  log(`Restoring pristine ${backupPath} -> ${asarPath}...`);
  fs.copyFileSync(backupPath, asarPath);
  success('Successfully restored original unpatched Yandex Music!');
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'install';

  const options = {
    appPath: null,
    configPath: null
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--app-path' && args[i + 1]) options.appPath = args[++i];
    if (args[i] === '--config-path' && args[i + 1]) options.configPath = args[++i];
  }

  console.log(`\n${BOLD}${CYAN}=== YANDEX MUSIC ENHANCER ===${RESET}\n`);

  if (command === 'install') {
    install(options);
  } else if (command === 'uninstall' || command === 'restore') {
    restore(options);
  } else {
    console.log(`Usage: node patcher.js [install | uninstall | restore] [--app-path <path>] [--config-path <path>]`);
  }
}

main();
