#!/usr/bin/env node
// Descarga el contrato OpenAPI publicado por el backend Laravel y guarda una
// copia local versionada en openapi/. No genera tipos (ver generate-types.mjs).
//
// Uso:
//   npm run contract:fetch
//   OPENAPI_CONTRACT_URL=https://api.lapesquerapp.es/openapi/frontend.yaml npm run contract:fetch
//
// Por qué se versiona la copia local (openapi/frontend.yaml) en vez de
// generar directamente desde la URL en cada build: frontend y backend viven
// en repos separados, y un build de producción no debe depender
// silenciosamente de que esa URL esté disponible en ese instante. Descargar
// es un paso explícito, revisado vía diff de git antes de hacer commit.

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildLock, deriveMetaUrl, resolveContractUrl } from './lib/contract-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const CONTRACT_DIR = path.join(ROOT, 'openapi');
const CONTRACT_FILE = path.join(CONTRACT_DIR, 'frontend.yaml');
const META_FILE = path.join(CONTRACT_DIR, 'meta.json');
const LOCK_FILE = path.join(CONTRACT_DIR, 'contract-lock.json');

async function main() {
  const contractUrl = resolveContractUrl(process.env);
  if (!contractUrl) {
    console.error(
      '[contract:fetch] No se pudo determinar la URL del contrato.\n' +
        '[contract:fetch] Define OPENAPI_CONTRACT_URL, o NEXT_PUBLIC_API_URL / NEXT_PUBLIC_API_BASE_URL.\n' +
        '[contract:fetch] Ejemplo: OPENAPI_CONTRACT_URL=https://api.lapesquerapp.es/openapi/frontend.yaml npm run contract:fetch'
    );
    process.exit(1);
  }

  console.log(`[contract:fetch] Descargando contrato desde ${contractUrl}`);
  let res;
  try {
    res = await fetch(contractUrl);
  } catch (err) {
    console.error(`[contract:fetch] No se pudo conectar con ${contractUrl}: ${err.message}`);
    process.exit(1);
  }
  if (!res.ok) {
    console.error(`[contract:fetch] HTTP ${res.status} ${res.statusText} al descargar el contrato.`);
    process.exit(1);
  }
  const contractText = await res.text();
  if (!contractText.trim()) {
    console.error('[contract:fetch] El contrato descargado está vacío.');
    process.exit(1);
  }

  const metaUrl = deriveMetaUrl(contractUrl);
  let backendMeta = null;
  try {
    const metaRes = await fetch(metaUrl);
    if (metaRes.ok) {
      backendMeta = await metaRes.json();
    } else {
      console.warn(
        `[contract:fetch] meta.json no disponible (HTTP ${metaRes.status}) — se continúa sin metadatos del backend.`
      );
    }
  } catch (err) {
    console.warn(`[contract:fetch] No se pudo leer meta.json (${metaUrl}): ${err.message}`);
  }

  mkdirSync(CONTRACT_DIR, { recursive: true });
  writeFileSync(CONTRACT_FILE, contractText, 'utf8');
  if (backendMeta) {
    writeFileSync(META_FILE, JSON.stringify(backendMeta, null, 2) + '\n', 'utf8');
  }

  const lock = buildLock({ sourceUrl: contractUrl, contractText, backendMeta });
  writeFileSync(LOCK_FILE, JSON.stringify(lock, null, 2) + '\n', 'utf8');

  console.log(`[contract:fetch] Guardado en ${path.relative(ROOT, CONTRACT_FILE)}`);
  console.log(`[contract:fetch] sha256: ${lock.contractHash}`);
  console.log(
    '[contract:fetch] Revisa el diff de git antes de hacer commit. ' +
      'Ejecuta "npm run contract:generate" (o "npm ci") para regenerar los tipos TypeScript.'
  );
}

main().catch((err) => {
  console.error('[contract:fetch] Error inesperado:', err);
  process.exit(1);
});
