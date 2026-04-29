/// <reference types="vite/client" />

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string | undefined;

// Déclarations pour vite-plugin-svgr (import .svg?react)
declare module '*.svg?react' {
  import React from 'react';
  export default React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
}

// Import .svg standard = URL (comportement par défaut Vite)
declare module '*.svg' {
  const src: string;
  export default src;
}
