#!/usr/bin/env node
// Verifica que el contrato local esté sincronizado consigo mismo (no editado
// a mano) y sea un OpenAPI generable, sin tocar la red. Pensado para CI
// (ver .github/workflows/build-check.yml, job "contract-check") y para
// correrse a mano antes de un PR que toque openapi/frontend.yaml.
//
// No detecta si el backend ha publicado una versión más nueva del contrato
// — eso lo cubre el workflow separado de detección de drift (fetch real +
// diff), que si se ejecuta contra la URL pública en un entorno con red.

import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyContract } from './lib/contract-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const CONTRACT_FILE = path.join(ROOT, 'openapi', 'frontend.yaml');
const LOCK_FILE = path.join(ROOT, 'openapi', 'contract-lock.json');
const CLI_BIN = path.join(
  ROOT,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'openapi-typescript.cmd' : 'openapi-typescript'
);

function main() {
  if (!existsSync(CLI_BIN)) {
    console.error(`[contract:verify] No se encontró el binario de openapi-typescript en ${CLI_BIN}. Ejecuta "npm ci".`);
    process.exit(1);
  }

  const result = verifyContract({ contractPath: CONTRACT_FILE, lockPath: LOCK_FILE, cliBin: CLI_BIN });

  if (result.status === 'missing') {
    console.warn(
      '[contract:verify] ⚠️  No hay contrato local todavía (openapi/frontend.yaml no existe).\n' +
        '[contract:verify] Ejecuta "npm run contract:fetch" para adoptarlo. Verificación omitida (no bloqueante en este estado de bootstrap).'
    );
    process.exit(0);
  }

  if (result.status === 'error') {
    console.error(`[contract:verify] ❌ ${result.reason}`);
    process.exit(1);
  }

  console.log('[contract:verify] ✅ Contrato válido y sincronizado con su lock.');
  console.log(`[contract:verify]    sha256: ${result.lock.contractHash}`);
  console.log(`[contract:verify]    fetchedAt: ${result.lock.fetchedAt}`);
  if (result.lock.backendMeta) {
    console.log(`[contract:verify]    backend meta: ${JSON.stringify(result.lock.backendMeta)}`);
  }
}

main();
