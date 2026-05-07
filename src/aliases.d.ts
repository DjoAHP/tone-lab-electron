// Déclaration de types pour les alias Vite
// Évite d'utiliser "paths" dans tsconfig.json (baseUrl déprécié)

declare module '@/*' {
  const value: any;
  export default value;
}
