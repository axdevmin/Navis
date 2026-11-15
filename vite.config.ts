import { defineConfig, Plugin } from "vite";
import macrosPlugin from "vite-plugin-babel-macros";
import react from "@vitejs/plugin-react";

/**
 * babel-plugin-relay (v10) émet des `require("./__generated__/X.graphql")`.
 * Le build de prod les résout, mais le serveur de dev sert de l'ESM natif où
 * `require` n'existe pas : l'app plantait au chargement ("require is not
 * defined"). En dev on réécrit donc ces appels en imports ESM.
 */
const relayRequireToImport = (): Plugin => ({
  name: "relay-require-to-import",
  apply: "serve",
  enforce: "post",
  transform(code, id) {
    if (id.includes("/node_modules/") || !/\.[jt]sx?(\?|$)/.test(id)) {
      return null;
    }
    if (!code.includes("__generated__")) {
      return null;
    }
    const imports: Array<string> = [];
    const replaced = code.replace(
      /require\((["'])(\.{1,2}\/[^"']*__generated__\/[^"']+)\1\)/g,
      (_match, _quote, path) => {
        const name = `__relayArtifact${imports.length}`;
        imports.push(`import ${name} from ${JSON.stringify(path)};`);
        return name;
      }
    );
    if (imports.length === 0) {
      return null;
    }
    return { code: `${imports.join("\n")}\n${replaced}`, map: null };
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), macrosPlugin(), relayRequireToImport()],

  server: {
    port: 4000,
    proxy: {
      "/api/socket.io": { target: "ws://localhost:3000", ws: true },
      "/api": "http://localhost:3000",
      "/files": "http://localhost:3000",
    },
  },
  optimizeDeps: {
    exclude: ["react-spring", "@react-spring/web", "@react-spring/three"],
  },
  build: {
    outDir: "build",
  },
});
