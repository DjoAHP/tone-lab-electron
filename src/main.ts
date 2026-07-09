/// <reference path="./vite-env.d.ts" />
import { app, BrowserWindow, Menu, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import https from 'node:https';
import { spawn } from 'node:child_process';
import { LOCAL_CERT, LOCAL_KEY } from './localCert';

// ── Serveur HTTPS local pour servir le renderer avec une VRAIE origine https ──
// Depuis oct. 2025, YouTube exige que les vidéos intégrées viennent d'une origine
// HTTPS avec un Referer https valide et COHÉRENT (sinon erreurs 150/152/153).
// file://, app://, http:// et http://127.0.0.1 échouent tous. On sert donc le
// renderer via https://tonelab.local (mappé sur 127.0.0.1) : origine https réelle
// + Referer https cohérent → l'intégration YouTube marche comme sur la PWA.
const APP_HOST = 'tonelab.local';
let rendererPort = 0;

// Mappe le faux domaine tonelab.local vers la boucle locale (doit être défini
// AVANT app.whenReady). Chromium résout ainsi tonelab.local → 127.0.0.1.
app.commandLine.appendSwitch('host-resolver-rules', `MAP ${APP_HOST} 127.0.0.1`);

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.map': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
};

// Démarre un serveur HTTPS local (127.0.0.1, port aléatoire) qui sert les
// fichiers du renderer depuis l'app (asar inclus). Retourne le port attribué.
function startRendererServer(): Promise<number> {
  const rendererRoot = path.join(
    __dirname,
    `../renderer/${MAIN_WINDOW_VITE_NAME}`,
  );

  return new Promise((resolve, reject) => {
    const server = https.createServer(
      { cert: LOCAL_CERT, key: LOCAL_KEY },
      async (req, res) => {
        try {
          const reqUrl = new URL(req.url || '/', `https://${APP_HOST}`);
          let pathname = decodeURIComponent(reqUrl.pathname);
          if (pathname === '/' || pathname === '') pathname = '/index.html';

          const filePath = path.join(rendererRoot, pathname);
          // Empêche toute sortie du dossier renderer (path traversal)
          if (!filePath.startsWith(rendererRoot)) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
          }

          const data = await fs.promises.readFile(filePath);
          const ext = path.extname(filePath).toLowerCase();
          res.writeHead(200, {
            'Content-Type': MIME_TYPES[ext] ?? 'application/octet-stream',
          });
          res.end(data);
        } catch {
          res.writeHead(404);
          res.end('Not found');
        }
      },
    );

    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') resolve(addr.port);
      else reject(new Error('Impossible de déterminer le port du serveur'));
    });
  });
}


// Détecte l'exécution sous WSL (WSLg n'a pas de gestionnaire d'URL Linux)
function isWSL(): boolean {
  if (process.platform !== 'linux') return false;
  if (process.env.WSL_DISTRO_NAME || process.env.WSL_INTEROP) return true;
  try {
    return fs
      .readFileSync('/proc/version', 'utf8')
      .toLowerCase()
      .includes('microsoft');
  } catch {
    return false;
  }
}

// Ouvre une URL externe dans le navigateur système (Windows sous WSL, sinon natif)
function openExternalUrl(url: string): void {
  if (isWSL()) {
    // Sous WSL : passer par l'interop Windows pour ouvrir le navigateur par défaut
    try {
      spawn('explorer.exe', [url], { detached: true, stdio: 'ignore' }).unref();
      return;
    } catch (e) {
      console.error('explorer.exe open failed, fallback shell.openExternal', e);
    }
  }
  shell.openExternal(url);
}

let started = false;
if (app.isPackaged) {
  try {
    started = require('electron-squirrel-startup');
  } catch (e) {
    console.error('Failed to load electron-squirrel-startup', e);
  }
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Gère l'ouverture des popups/liens externes
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Popups locales utilisées pour l'export PDF (window.open("", "_blank"))
    if (url === 'about:blank' || url.startsWith('data:')) {
      return { action: 'allow' };
    }
    // Liens externes (sites de plugins, etc.) → navigateur système, pas de fenêtre in-app
    if (url.startsWith('https:') || url.startsWith('http:')) {
      openExternalUrl(url);
    }
    return { action: 'deny' };
  });

  // Maximiser la fenêtre au démarrage (plein écran avec barre des tâches)
  mainWindow.maximize();

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    // Servi via https://tonelab.local (origine https réelle et cohérente) au
    // lieu de file:// → nécessaire pour l'API IFrame YouTube (DocV).
    mainWindow.loadURL(`https://${APP_HOST}:${rendererPort}/index.html`);
  }

  // Open the DevTools & Menu bar par défaut.

  // DEVTOOLS = Décommenter pour ouvrir les DevTools au démarrage
  // mainWindow.webContents.openDevTools();

  // MENU = Commenter pour afficher
  Menu.setApplicationMenu(null);

};


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // En production, on sert le renderer via un serveur HTTPS local
  // (pas en dev où Vite sert déjà en http).
  if (!MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    rendererPort = await startRendererServer();
  }
  createWindow();
});

// Accepte le certificat auto-signé de notre serveur local (tonelab.local
// uniquement). Toutes les autres erreurs de certificat restent bloquées.
app.on('certificate-error', (event, _wc, url, _error, _cert, callback) => {
  if (url.startsWith(`https://${APP_HOST}`)) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
