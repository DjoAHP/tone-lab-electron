// Preload script : expose une API sécurisée (contextBridge) au renderer.
// Pont entre le processus principal (main.ts) et l'UI React.

import { contextBridge, ipcRenderer } from "electron";

// Type des outils disposant d'une aide dédiée
export type HelpTool = "stack" | "setlist";

// Résultat de la sélection d'un fichier audio local
export interface AudioFileResult {
  name: string;
  buffer: ArrayBuffer;
  mime: string;
}

const electronAPI = {
  // Demande au processus principal d'ouvrir (ou de focus) la fenêtre d'aide
  // pour l'outil donné.
  openHelp(tool: HelpTool): void {
    ipcRenderer.send("help:open", tool);
  },

  // Demande au processus principal d'ouvrir une URL dans le navigateur système.
  openExternal(url: string): void {
    ipcRenderer.send("shell:openExternal", url);
  },

  // Ouvre le dialogue natif de sélection de fichier audio (mp3/wav/flac).
  // Renvoie null si l'utilisateur annule, sinon { name, buffer, mime }.
  openAudioFile(): Promise<AudioFileResult | null> {
    return ipcRenderer.invoke("dialog:openAudioFile");
  },
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
