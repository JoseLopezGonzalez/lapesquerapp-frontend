#!/usr/bin/env node
// Verifica, sin red, que el mecanismo de contrato esté sano: el contrato
// adoptado existe, no fue editado a mano, es un OpenAPI generable, y los
// tipos generados en disco no están desactualizados respecto a él. Pensado
// para CI (ver .github/workflows/build-check.yml, job "contract-check") y
// para correrse a mano antes de un PR que toque openapi/frontend.yaml.
//
// Mecanismo endurecido: cualquier ausencia (contrato, lock, tipos
// generados) o desactualización es un fallo duro (exit 1) — no existe un
// modo bootstrap que deje pasar la verificación sin contrato.
//
// No detecta si el backend ha publicado una versión más nueva del contrato
// — eso lo cubre el workflow separado de detección de drift (fetch real +
// diff), que sí requiere red (ver check-drift.mjs).

import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyContract } from './lib/contract-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const CONTRACT_FILE = path.join(ROOT, 'openapi', 'frontend.yaml');
const LOCK_FILE = path.join(ROOT, 'openapi', 'contract-lock.json');
const GENERATED_FILE = path.join(ROOT, 'src', 'types', 'generated', 'api.d.ts');
const CLI_BIN = path.join(
  ROOT,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'openapi-typescript.cmd' : 'openapi-typescript'
);

function main() {
  if (!existsSync(CLI_BIN)) {
    console.error(
      `[contract:verify] No se encontró el binario de openapi-typescript en ${CLI_BIN}. Ejecuta "npm ci".`
    );
    process.exit(1);
  }

  const result = verifyContract({
    contractPath: CONTRACT_FILE,
    lockPath: LOCK_FILE,
    generatedPath: GENERATED_FILE,
    cliBin: CLI_BIN,
  });

  if (result.status === 'error') {
    console.error(`[contract:verify] ❌ ${result.reason}`);
    process.exit(1);
  }

  console.log('[contract:verify] ✅ Contrato válido, sincronizado con su lock, y tipos generados al día.');
  console.log(`[contract:verify]    sha256: ${result.lock.contractHash}`);
  console.log(`[contract:verify]    fetchedAt: ${result.lock.fetchedAt}`);
  if (result.lock.backendMeta) {
    console.log(`[contract:verify]    backend meta: ${JSON.stringify(result.lock.backendMeta)}`);
  }
}

main();
