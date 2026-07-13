/// <reference types="vite/client" />

// Déclarations pour les imports SVG avec ?react
declare module "*.svg?react" {
  import type React from "react";
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}

// Variables d'environnement Electron Forge
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

// Variable de version injectée par Vite
declare const __APP_VERSION__: string;

// API exposée par le preload (contextBridge) au renderer
type HelpTool = "stack" | "setlist";

interface AudioFileResult {
  name: string;
  buffer: ArrayBuffer;
  mime: string;
}

interface ElectronAPI {
  openHelp(tool: HelpTool): void;
  openExternal(url: string): void;
  openAudioFile(): Promise<AudioFileResult | null>;
}

// Augmentation de l'interface globale Window (fichier .d.ts script)
interface Window {
  electronAPI: ElectronAPI;
}
