import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import svgr from "vite-plugin-svgr"
import { readFileSync } from "fs"

const pkg = JSON.parse(readFileSync(new URL("package.json", import.meta.url), "utf-8"))

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
})
