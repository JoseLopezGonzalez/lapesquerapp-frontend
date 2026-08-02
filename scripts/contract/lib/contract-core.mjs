// Lógica pura del pipeline de contrato OpenAPI, separada de los scripts CLI
// (fetch-contract.mjs / generate-types.mjs / verify-contract.mjs) para poder
// testearla sin red y sin depender de las rutas reales del repo.
//
// Plain .mjs (no .ts) a propósito, igual que scripts/build-gaps-registry.mjs:
// scripts standalone que corren fuera del build de Next con `node` plano. La
// regla .js vs .ts de CLAUDE.md apunta a código de aplicación bajo src/.
//
// Mecanismo endurecido (sin modo bootstrap): el contrato adoptado
// (openapi/frontend.yaml) y sus tipos generados son un requisito, no una
// posibilidad. Cualquier ausencia, edición a mano, o desactualización es un
// error duro (status: 'error'), nunca un aviso silencioso.

import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

/**
 * URL fija de fallback cuando no hay ninguna variable de entorno que la
 * resuelva. El backend publica el contrato en una URL fija por entorno
 * ({APP_URL}/openapi/frontend.yaml); esta es la de producción, para que
 * resolveContractUrl() nunca devuelva un valor indeterminado.
 */
export const DEFAULT_CONTRACT_URL = 'https://api.lapesquerapp.es/openapi/frontend.yaml';

/**
 * Resuelve la URL del contrato OpenAPI a partir del entorno. Siempre
 * devuelve una URL concreta (nunca null) — no existe un estado de "no se
 * pudo determinar la URL".
 *
 * Prioridad: OPENAPI_CONTRACT_URL explícita > derivada de NEXT_PUBLIC_API_URL/
 * NEXT_PUBLIC_API_BASE_URL (mismas env vars que src/configs/config.js) >
 * DEFAULT_CONTRACT_URL (producción).
 */
export function resolveContractUrl(env = process.env) {
  if (env.OPENAPI_CONTRACT_URL) return env.OPENAPI_CONTRACT_URL;

  const base = (env.NEXT_PUBLIC_API_URL || env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
  if (base) return `${base}/openapi/frontend.yaml`;

  return DEFAULT_CONTRACT_URL;
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
 * Banner prependido al archivo generado. Compartido entre generate-types.mjs
 * (lo escribe) y verifyContract (lo reproduce para poder comparar byte a
 * byte y detectar tipos desactualizados) — deben ser idénticos.
 */
export const GENERATED_FILE_BANNER = `/**
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

/** Aplica el banner al output crudo de openapi-typescript. */
export function withBanner(rawOutput) {
  return GENERATED_FILE_BANNER + '\n' + rawOutput;
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
 * Verifica, sin red, que el mecanismo de contrato esté en un estado
 * correcto y termina de forma dura ante cualquier desviación:
 *
 *  1. El contrato (`contractPath`) debe existir.
 *  2. Su hash debe coincidir con el registrado en `lockPath` (si no,
 *     alguien lo editó a mano — el contrato es de solo lectura).
 *  3. Debe ser un OpenAPI generable (openapi-typescript no debe fallar).
 *  4. Si se pasa `generatedPath`, los tipos generados deben existir y ser
 *     bit-a-bit idénticos a regenerarlos ahora mismo desde el contrato — si
 *     no, están desactualizados.
 *
 * Devuelve siempre { status: 'ok' | 'error', reason?, lock? }. No existe un
 * estado 'missing'/bootstrap: la ausencia de cualquier pieza es un error.
 */
export function verifyContract({ contractPath, lockPath, generatedPath, cliBin }) {
  if (!existsSync(contractPath)) {
    return {
      status: 'error',
      reason: `No existe ${contractPath}. El contrato no está adoptado — ejecuta "npm run contract:fetch" (o "npm run contract:update").`,
    };
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
  const genResult = runOpenApiTypeScript({
    cliBin,
    inputPath: contractPath,
    outputPath: tmpOut,
    extraArgs: ['--alphabetize'],
  });

  if (!genResult.success) {
    rmSync(tmpDir, { recursive: true, force: true });
    return {
      status: 'error',
      reason: `openapi-typescript no pudo generar tipos desde el contrato:\n${genResult.stderr || genResult.stdout}`,
      lock,
    };
  }

  if (generatedPath) {
    if (!existsSync(generatedPath)) {
      rmSync(tmpDir, { recursive: true, force: true });
      return {
        status: 'error',
        reason: `No existen tipos generados en ${generatedPath}. Ejecuta "npm run contract:generate" (o "npm ci").`,
        lock,
      };
    }

    const freshGenerated = withBanner(readFileSync(tmpOut, 'utf8'));
    const currentGenerated = readFileSync(generatedPath, 'utf8');
    rmSync(tmpDir, { recursive: true, force: true });

    if (freshGenerated !== currentGenerated) {
      return {
        status: 'error',
        reason: `${generatedPath} está desactualizado respecto a ${contractPath}. Ejecuta "npm run contract:generate".`,
        lock,
      };
    }
  } else {
    rmSync(tmpDir, { recursive: true, force: true });
  }

  return { status: 'ok', lock };
}
