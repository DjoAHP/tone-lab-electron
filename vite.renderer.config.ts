import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import svgr from "vite-plugin-svgr"
import { readFileSync } from "fs"

const pkg = JSON.parse(readFileSync(new URL("package.json", import.meta.url), "utf-8"))

// En dev seul (npm run dev, ouvert dans un navigateur), on sert Vite en HTTPS
// sur localhost pour donner une origine https réelle → l'API YouTube du DocV
// fonctionne aussi hors d'Electron. En dev Electron (npm start) et en prod, on
// laisse le défaut (Vite en HTTP, proxifié/produit en HTTPS ailleurs).
const isStandaloneDev = process.env.npm_lifecycle_event === "dev"

export default defineConfig({
  plugins: [react(), svgr()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: isStandaloneDev
    ? {
        host: "localhost",
        https: true,
      }
    : undefined,
})
