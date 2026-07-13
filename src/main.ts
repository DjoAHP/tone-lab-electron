import "./vite-env.d.ts";
import { app, BrowserWindow, Menu, shell, ipcMain, dialog } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import { spawn } from 'node:child_process';
import { LOCAL_CERT, LOCAL_KEY } from './localCert';
import squirrelStartup from "electron-squirrel-startup";

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

// En dev (npm start), Vite sert le renderer en http://localhost:5173 (origine
// HTTP) → l'API IFrame YouTube (DocV) est bloquée (erreurs 150/152/153). On
// proxifie Vite à travers notre serveur HTTPS local tonelab.local pour donner
// au renderer une VRAIE origine HTTPS, cohérente avec la prod et la PWA.
// Le proxy gère aussi l'upgrade WebSocket afin de préserver le HMR Vite.
function startDevProxy(targetDevUrl: string): Promise<number> {
  const target = new URL(targetDevUrl);

  const server = https.createServer(
    { cert: LOCAL_CERT, key: LOCAL_KEY },
    (req, res) => {
      const proxyReq = http.request(
        {
          host: target.hostname,
          port: target.port,
          path: req.url,
          method: req.method,
          headers: { ...req.headers, host: target.host },
        },
        (proxyRes) => {
          res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
          proxyRes.pipe(res);
        },
      );
      proxyReq.on('error', () => res.destroy());
      req.pipe(proxyReq);
    },
  );

  // Proxy du WebSocket HMR (ws://localhost:5173 → wss://tonelab.local:<port>)
  server.on('upgrade', (req, clientSocket) => {
    const proxyReq = http.request({
      host: target.hostname,
      port: target.port,
      path: req.url,
      method: req.method,
      headers: req.headers,
    });

    proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
      clientSocket.write(
        'HTTP/1.1 101 Switching Protocols\r\n' +
          'Upgrade: websocket\r\n' +
          'Connection: Upgrade\r\n' +
          `Sec-WebSocket-Accept: ${String(proxyRes.headers['sec-websocket-accept'])}\r\n\r\n`,
      );
      if (proxyHead && proxyHead.length) proxySocket.write(proxyHead);
      proxySocket.pipe(clientSocket);
      clientSocket.pipe(proxySocket);
    });

    proxyReq.on('error', () => clientSocket.destroy());
    proxyReq.end();
  });

  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') resolve(addr.port);
      else reject(new Error('Impossible de déterminer le port du proxy dev'));
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
    started = squirrelStartup as unknown as boolean;
  } catch (e) {
    console.error('Failed to load electron-squirrel-startup', e);
  }
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Référence module-level sur la fenêtre principale (pour les dialogues natifs).
let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
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
  // En dev comme en prod, le renderer est servi via https://tonelab.local
  // (proxy HTTPS vers Vite en dev, serveur statique en prod) → origine https
  // réelle et cohérente, nécessaire pour l'API IFrame YouTube (DocV).
  mainWindow.loadURL(`https://${APP_HOST}:${rendererPort}/index.html`);

  // Open the DevTools & Menu bar par défaut.

  // DEVTOOLS = Décommenter pour ouvrir les DevTools au démarrage
  // mainWindow.webContents.openDevTools();

  // MENU = Commenter pour afficher
  Menu.setApplicationMenu(null);

};

// ─────────────────────────────────────────────
// Fenêtre d'aide (séparée, non modale)
// Fenêtre indépendante du main window : elle peut passer DERRIÈRE l'app
// quand on clique ailleurs, sans se fermer. On la ré-affiche facilement
// via le menu « Aide » (elle est réutilisée, pas recréée).
// ─────────────────────────────────────────────
let helpWindow: BrowserWindow | null = null;

function createHelpWindow(tool: string) {
  // Si la fenêtre existe déjà : on la ré-affiche, on la remet au premier plan,
  // et on recharge son contenu si l'outil demandé diffère.
  if (helpWindow && !helpWindow.isDestroyed()) {
    helpWindow.loadURL(
      `https://${APP_HOST}:${rendererPort}/index.html?win=help&tool=${tool}`,
    );
    helpWindow.show();
    helpWindow.focus();
    return;
  }

  helpWindow = new BrowserWindow({
    width: 960,
    height: 720,
    minWidth: 520,
    minHeight: 420,
    resizable: true,
    show: true,
    backgroundColor: "#0c0e16",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  helpWindow.loadURL(
    `https://${APP_HOST}:${rendererPort}/index.html?win=help&tool=${tool}`,
  );

  // Libère la référence quand l'utilisateur ferme la fenêtre
  helpWindow.on('closed', () => {
    helpWindow = null;
  });

  // Les liens externes (ex : YouTube) ouvrent le navigateur système
  helpWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      openExternalUrl(url);
    }
    return { action: 'deny' };
  });
}

// ── Handlers IPC venant du renderer (menu Aide, liens externes) ──
ipcMain.on('help:open', (_event, tool: string) => {
  createHelpWindow(tool);
});

ipcMain.on('shell:openExternal', (_event, url: string) => {
  openExternalUrl(url);
});

// ── Ouverture d'un fichier audio local (mp3/wav/flac) pour le lecteur DocV ──
// Renvoie null si annulé, sinon { name, buffer (ArrayBuffer), mime }.
ipcMain.handle('dialog:openAudioFile', async () => {
  if (!mainWindow) return null;
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "Choisir un fichier audio",
      properties: ['openFile'],
      filters: [
        { name: 'Audio', extensions: ['mp3', 'wav', 'flac'] },
        { name: 'Tous les fichiers', extensions: ['*'] },
      ],
    });
    if (result.canceled || result.filePaths.length === 0) return null;

    const filePath = result.filePaths[0];
    const ext = path.extname(filePath).slice(1).toLowerCase();
    const mimeByExt: Record<string, string> = {
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      flac: 'audio/flac',
    };
    const mime = mimeByExt[ext] ?? 'application/octet-stream';
    const data = fs.readFileSync(filePath);
    // Copie dans un ArrayBuffer neuf (le Buffer fs peut être plus large que la vue).
    const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    return { name: path.basename(filePath), buffer, mime };
  } catch (err) {
    console.error('[DocV] Erreur lecture fichier audio :', err);
    return null;
  }
});


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // En dev (Vite), on proxifie le serveur Vite via le serveur HTTPS local
  // tonelab.local (origine https → YouTube DocV fonctionnel). En prod, on sert
  // le renderer statiquement via le même serveur HTTPS local.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    rendererPort = await startDevProxy(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
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
