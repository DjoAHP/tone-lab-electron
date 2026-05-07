// Déclarations pour les variables injectées par Vite
declare const __APP_VERSION__: string;

// Déclarations pour les imports SVG (svgr)
declare module '*.svg?react' {
  import React = require('react');
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}

// Variables injectées par Electron Forge Vite plugin
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;
