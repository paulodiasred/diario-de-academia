import { build } from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));

// O código compartilhado de ../src entra no pacote: só a pasta functions/ é publicada.
await build({
  entryPoints: [path.join(aqui, "src/index.ts")],
  outfile: path.join(aqui, "lib/index.js"),
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  packages: "external",
  alias: { "@": path.join(aqui, "../src") },
  logLevel: "warning",
});
