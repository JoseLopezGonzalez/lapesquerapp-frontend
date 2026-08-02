#!/usr/bin/env node
// Descarga el contrato real del backend y lo compara contra la copia local
// comprometida (openapi/frontend.yaml + contract-lock.json), SIN sobrescribir
// nada. Pensado para el workflow programado de detección de drift
// (.github/workflows/contract-drift.yml), no para el flujo de desarrollo
// normal (para eso: "npm run contract:update").
//
// Mecanismo endurecido: si no hay contrato local adoptado, esto es un error
// de configuración del repo (no un estado de bootstrap válido) — falla con
// exit 1 igual que cualquier otro fallo de este script.
//
// Exit code 0: sin drift — el contrato local sigue coincidiendo con el backend.
// Exit code 1: falta el contrato local, no se pudo contactar con el backend,
// o el backend publicó una versión distinta a la adoptada.

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveContractUrl, sha256 } from './lib/contract-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const CONTRACT_FILE = path.join(ROOT, 'openapi', 'frontend.yaml');
const LOCK_FILE = path.join(ROOT, 'openapi', 'contract-lock.json');

async function main() {
  if (!existsSync(CONTRACT_FILE) || !existsSync(LOCK_FILE)) {
    console.error(
      '[contract:drift] ❌ No hay contrato local adoptado (openapi/frontend.yaml y/o contract-lock.json faltan).\n' +
        '[contract:drift] Ejecuta "npm run contract:update" — un repo correctamente onboardeado siempre tiene el contrato adoptado.'
    );
    process.exit(1);
  }

  const contractUrl = resolveContractUrl(process.env);
  const lock = JSON.parse(readFileSync(LOCK_FILE, 'utf8'));
  const localHash = sha256(readFileSync(CONTRACT_FILE, 'utf8'));

  console.log(`[contract:drift] Comparando contra ${contractUrl}`);
  let res;
  try {
    res = await fetch(contractUrl);
  } catch (err) {
    console.error(`[contract:drift] ❌ No se pudo conectar con el backend: ${err.message}`);
    process.exit(1);
  }
  if (!res.ok) {
    console.error(`[contract:drift] ❌ HTTP ${res.status} ${res.statusText} al descargar el contrato remoto.`);
    process.exit(1);
  }
  const remoteText = await res.text();
  const remoteHash = sha256(remoteText);

  if (remoteHash === localHash) {
    console.log('[contract:drift] ✅ Sin drift — el contrato local sigue coincidiendo con el backend.');
    process.exit(0);
  }

  console.error(
    '[contract:drift] ⚠️  El backend publicó una versión distinta del contrato.\n' +
      `[contract:drift]    local (adoptado ${lock.fetchedAt}): ${localHash}\n` +
      `[contract:drift]    remoto (ahora):                    ${remoteHash}\n` +
      '[contract:drift] Ejecuta "npm run contract:update" a propósito, revisa el diff de tipos generados y de los servicios que los consumen antes de hacer commit.'
  );
  process.exit(1);
}

main();
