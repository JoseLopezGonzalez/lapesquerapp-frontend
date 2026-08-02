// Lógica pura del pipeline de contrato OpenAPI, separada de los scripts CLI
// (fetch-contract.mjs / generate-types.mjs / verify-contract.mjs) para poder
// testearla sin red y sin depender de las rutas reales del repo.
//
// Plain .mjs (no .ts) a propósito, igual que scripts/build-gaps-registry.mjs:
// scripts standalone que corren fuera del build de Next con `node` plano. La
// regla .js vs .ts de CLAUDE.md apunta a código de aplicación bajo src/.

import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

/**
 * Resuelve la URL del contrato OpenAPI a partir del entorno.
 * Prioridad: OPENAPI_CONTRACT_URL explícita > derivada de NEXT_PUBLIC_API_URL/
 * NEXT_PUBLIC_API_BASE_URL (mismas env vars que src/configs/config.js).
 */
export function resolveContractUrl(env = process.env) {
  if (env.OPENAPI_CONTRACT_URL) return env.OPENAPI_CONTRACT_URL;

  const base = (env.NEXT_PUBLIC_API_URL || env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
  if (!base) return null;
  return `${base}/openapi/frontend.yaml`;
}

/** Deriva la URL de meta.json a partir de la URL de frontend.yaml (mismo directorio). */
export function deriveMetaUrl(contractUrl) {
  return contractUrl.replace(/\/frontend\.yaml(\?.*)?$/, '/meta.json$1');
}

/** sha256 hex de un texto — usado para el lock file y para detectar ediciones a mano. */
export function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

/** Construye el contenido de openapi/contract-lock.json. */
export function buildLock({ sourceUrl, contractText, backendMeta, fetchedAt }) {
  const lock = {
    sourceUrl,
    fetchedAt: fetchedAt ?? new Date().toISOString(),
    contractHash: sha256(contractText),
  };
  if (backendMeta) lock.backendMeta = backendMeta;
  return lock;
}

/**
 * Invoca el binario CLI de openapi-typescript sobre un input y escribe en output.
 * Devuelve { success, stderr, stdout } en vez de lanzar, para que el caller decida
 * cómo reportar el fallo (script real vs test).
 */
export function runOpenApiTypeScript({ cliBin, inputPath, outputPath, extraArgs = [] }) {
  const result = spawnSync(cliBin, [inputPath, '-o', outputPath, ...extraArgs], {
    encoding: 'utf8',
  });
  return {
    success: result.status === 0,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    error: result.error,
  };
}

/**
 * Verifica que openapi/frontend.yaml + contract-lock.json estén sincronizados
 * y que el contrato sea un OpenAPI válido (generable). No requiere red.
 *
 * Devuelve { status: 'missing' | 'ok' | 'error', reason?, lock? }.
 * 'missing' es un estado de bootstrap (aún no se ha hecho el primer fetch) y
 * no debe tratarse como fallo bloqueante en CI.
 */
export function verifyContract({ contractPath, lockPath, cliBin }) {
  if (!existsSync(contractPath)) {
    return { status: 'missing' };
  }

  const contractText = readFileSync(contractPath, 'utf8');
  const actualHash = sha256(contractText);

  if (!existsSync(lockPath)) {
    return {
      status: 'error',
      reason: `Existe ${contractPath} pero falta ${lockPath}. Regenera con "npm run contract:fetch".`,
    };
  }

  let lock;
  try {
    lock = JSON.parse(readFileSync(lockPath, 'utf8'));
  } catch (err) {
    return { status: 'error', reason: `${lockPath} no es JSON válido: ${err.message}` };
  }

  if (lock.contractHash !== actualHash) {
    return {
      status: 'error',
      reason:
        `${contractPath} no coincide con el hash registrado en ${path.basename(lockPath)}. ` +
        'Parece editado a mano — el contrato es de solo lectura, usa "npm run contract:fetch".',
      lock,
    };
  }

  const tmpDir = mkdtempSync(path.join(tmpdir(), 'contract-verify-'));
  const tmpOut = path.join(tmpDir, 'api.d.ts');
  const genResult = runOpenApiTypeScript({ cliBin, inputPath: contractPath, outputPath: tmpOut });
  rmSync(tmpDir, { recursive: true, force: true });

  if (!genResult.success) {
    return {
      status: 'error',
      reason: `openapi-typescript no pudo generar tipos desde el contrato:\n${genResult.stderr || genResult.stdout}`,
      lock,
    };
  }

  return { status: 'ok', lock };
}
