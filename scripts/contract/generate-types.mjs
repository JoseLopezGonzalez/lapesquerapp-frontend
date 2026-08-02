#!/usr/bin/env node
// Genera src/types/generated/api.d.ts a partir de openapi/frontend.yaml.
// No hace red — es una función pura del contrato ya descargado.
//
// Se ejecuta automáticamente en "postinstall" (ver package.json). Mecanismo
// endurecido: si openapi/frontend.yaml no existe, este comando FALLA (exit 1)
// en vez de continuar en silencio — el contrato adoptado es un requisito del
// repo, no un paso opcional. La única forma válida de resolverlo es
// "npm run contract:fetch" (o "npm run contract:update").
//
// Los tipos generados NO se versionan en git (ver .gitignore): se derivan de
// forma determinista del openapi/frontend.yaml sí versionado, así que
// regenerarlos en cada install/CI es equivalente a tenerlos comprometidos,
// sin el ruido de un diff enorme en cada cambio de contrato.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runOpenApiTypeScript, withBanner } from './lib/contract-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const CONTRACT_FILE = path.join(ROOT, 'openapi', 'frontend.yaml');
const GENERATED_DIR = path.join(ROOT, 'src', 'types', 'generated');
const GENERATED_FILE = path.join(GENERATED_DIR, 'api.d.ts');
const CLI_BIN = path.join(
  ROOT,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'openapi-typescript.cmd' : 'openapi-typescript'
);

function main() {
  if (!existsSync(CONTRACT_FILE)) {
    console.error(
      '[contract:generate] ❌ No existe openapi/frontend.yaml — el contrato no está adoptado.\n' +
        '[contract:generate] Ejecuta "npm run contract:fetch" (requiere red hacia el backend) antes de instalar/buildear.'
    );
    process.exit(1);
  }
  if (!existsSync(CLI_BIN)) {
    console.error(
      `[contract:generate] No se encontró el binario de openapi-typescript en ${CLI_BIN}.\n` +
        '[contract:generate] Ejecuta "npm ci" primero.'
    );
    process.exit(1);
  }

  mkdirSync(GENERATED_DIR, { recursive: true });
  const result = runOpenApiTypeScript({
    cliBin: CLI_BIN,
    inputPath: CONTRACT_FILE,
    outputPath: GENERATED_FILE,
    extraArgs: ['--alphabetize'],
  });

  if (!result.success) {
    console.error('[contract:generate] ❌ openapi-typescript falló al generar los tipos:');
    console.error(result.stderr || result.stdout);
    process.exit(1);
  }

  // openapi-typescript ya escribió GENERATED_FILE directamente (vía -o); lo
  // releemos para envolverlo con el mismo banner que usa verifyContract al
  // comparar (contract-core.mjs § withBanner) — deben producir bytes idénticos.
  const rawOutput = readFileSync(GENERATED_FILE, 'utf8');
  writeFileSync(GENERATED_FILE, withBanner(rawOutput), 'utf8');
  console.log(`[contract:generate] ✅ Tipos generados en ${path.relative(ROOT, GENERATED_FILE)}`);
}

main();
