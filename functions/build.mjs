import { build } from "esbuild";
import { existsSync, writeFileSync } from "node:fs";
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

// Sem este arquivo, o emulador procura a chave no Google Cloud a cada função e trava a primeira
// chamada até desistir. Ele só vale nos emuladores, fica fora do git e não é publicado. Uma chave
// real colocada aqui para testes locais nunca é sobrescrita.
const segredoLocal = path.join(aqui, ".secret.local");
if (!existsSync(segredoLocal)) writeFileSync(segredoLocal, "ANTHROPIC_API_KEY=simulada-so-nos-emuladores\n");
