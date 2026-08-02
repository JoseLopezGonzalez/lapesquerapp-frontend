#!/usr/bin/env node
// Genera src/types/generated/api.d.ts a partir de openapi/frontend.yaml.
// No hace red — es una función pura del contrato ya descargado.
//
// Se ejecuta automáticamente en "postinstall" (ver package.json), así que
// debe ser un no-op silencioso y no fatal si el contrato todavía no existe
// (repo recién clonado, contrato aún no adoptado) — de lo contrario rompería
// "npm ci" para cualquiera que instale el proyecto antes del primer
// "npm run contract:fetch".
//
// Los tipos generados NO se versionan en git (ver .gitignore): se derivan de
// forma determinista del openapi/frontend.yaml sí versionado, así que
// regenerarlos en cada install/CI es equivalente a tenerlos comprometidos,
// sin el ruido de un diff enorme en cada cambio de contrato.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runOpenApiTypeScript } from './lib/contract-core.mjs';

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

const BANNER = `/**
 * ARCHIVO GENERADO — NO EDITAR A MANO.
 *
 * Generado por "npm run contract:generate" a partir de openapi/frontend.yaml
 * (contrato OpenAPI publicado por el backend Laravel — fuente de verdad de
 * los tipos de API). Cualquier edición manual se perderá en la siguiente
 * regeneración (postinstall, o "npm run contract:generate" explícito).
 *
 * Para actualizar a la última versión del contrato: "npm run contract:update".
 * Flujo completo y reglas de uso: .claude/api-contract-guide.md
 */
`;

function main() {
  if (!existsSync(CONTRACT_FILE)) {
    console.warn(
      '[contract:generate] No existe openapi/frontend.yaml todavía — nada que generar.\n' +
        '[contract:generate] Ejecuta "npm run contract:fetch" (requiere red hacia el backend) para adoptar el contrato.'
    );
    return;
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
    console.error('[contract:generate] openapi-typescript falló al generar los tipos:');
    console.error(result.stderr || result.stdout);
    process.exit(1);
  }

  const generated = readFileSync(GENERATED_FILE, 'utf8');
  writeFileSync(GENERATED_FILE, BANNER + '\n' + generated, 'utf8');
  console.log(`[contract:generate] Tipos generados en ${path.relative(ROOT, GENERATED_FILE)}`);
}

main();
