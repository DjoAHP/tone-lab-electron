

/// <reference types="vite/client" />
  declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
  declare const MAIN_WINDOW_VITE_NAME: string | undefined;

// Déclare à TypeScript que les fichiers .svg importés avec ?react
// sont des composants React valides
declare module '*.svg?react' {
    import React from 'react';
    const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
    export default ReactComponent;
}