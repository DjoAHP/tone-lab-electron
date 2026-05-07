/// <reference types="vite/client" />

// Déclarations pour les imports SVG avec ?react
declare module "*.svg?react" {
  import React = require("react");
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}

// Variables d'environnement Electron Forge
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

// Variable de version injectée par Vite
declare const __APP_VERSION__: string;
