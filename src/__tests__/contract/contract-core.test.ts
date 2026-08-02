// Tests del pipeline de contrato OpenAPI (scripts/contract/lib/contract-core.mjs).
// Usan una fixture sintética (scripts/contract/__fixtures__/sample-openapi.yaml),
// nunca el contrato real del backend — el objetivo es probar que el
// mecanismo (fetch/generate/verify) funciona, no validar campos reales.
//
// Mecanismo endurecido: no hay estado "missing"/bootstrap — la ausencia de
// cualquier pieza (contrato, lock, tipos generados) o su desactualización
// es siempre status 'error'. Estos tests verifican exactamente eso.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  resolveContractUrl,
  deriveMetaUrl,
  sha256,
  buildLock,
  verifyContract,
  runOpenApiTypeScript,
  withBanner,
  DEFAULT_CONTRACT_URL,
} from '../../../scripts/contract/lib/contract-core.mjs';

const ROOT = path.resolve(__dirname, '..', '..', '..');
const FIXTURE = path.join(ROOT, 'scripts', 'contract', '__fixtures__', 'sample-openapi.yaml');
const CLI_BIN = path.join(
  ROOT,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'openapi-typescript.cmd' : 'openapi-typescript'
);

describe('resolveContractUrl', () => {
  it('prioriza OPENAPI_CONTRACT_URL explícita', () => {
    const url = resolveContractUrl({
      OPENAPI_CONTRACT_URL: 'https://example.test/openapi/frontend.yaml',
      NEXT_PUBLIC_API_URL: 'https://ignored.test',
    });
    expect(url).toBe('https://example.test/openapi/frontend.yaml');
  });

  it('deriva la URL de NEXT_PUBLIC_API_URL cuando no hay override', () => {
    const url = resolveContractUrl({ NEXT_PUBLIC_API_URL: 'https://api.lapesquerapp.es' });
    expect(url).toBe('https://api.lapesquerapp.es/openapi/frontend.yaml');
  });

  it('quita la barra final antes de derivar', () => {
    const url = resolveContractUrl({ NEXT_PUBLIC_API_URL: 'https://api.lapesquerapp.es/' });
    expect(url).toBe('https://api.lapesquerapp.es/openapi/frontend.yaml');
  });

  it('cae a NEXT_PUBLIC_API_BASE_URL si falta NEXT_PUBLIC_API_URL', () => {
    const url = resolveContractUrl({ NEXT_PUBLIC_API_BASE_URL: 'http://localhost:8000' });
    expect(url).toBe('http://localhost:8000/openapi/frontend.yaml');
  });

  it('nunca devuelve null/indeterminado — cae al fijo de producción si no hay ninguna env var', () => {
    const url = resolveContractUrl({});
    expect(url).toBe(DEFAULT_CONTRACT_URL);
    expect(url).toBe('https://api.lapesquerapp.es/openapi/frontend.yaml');
  });
});

describe('deriveMetaUrl', () => {
  it('sustituye frontend.yaml por meta.json en el mismo directorio', () => {
    expect(deriveMetaUrl('https://api.lapesquerapp.es/openapi/frontend.yaml')).toBe(
      'https://api.lapesquerapp.es/openapi/meta.json'
    );
  });
});

describe('sha256', () => {
  it('es determinista para el mismo contenido', () => {
    expect(sha256('hola')).toBe(sha256('hola'));
  });

  it('difiere para contenido distinto', () => {
    expect(sha256('hola')).not.toBe(sha256('adios'));
  });
});

describe('buildLock', () => {
  it('incluye contractHash y omite backendMeta si no se pasa', () => {
    const lock = buildLock({
      sourceUrl: 'https://x/frontend.yaml',
      contractText: 'openapi: 3.1.0',
    });
    expect(lock.sourceUrl).toBe('https://x/frontend.yaml');
    expect(lock.contractHash).toBe(sha256('openapi: 3.1.0'));
    expect(lock.backendMeta).toBeUndefined();
    expect(typeof lock.fetchedAt).toBe('string');
  });

  it('incluye backendMeta cuando se pasa', () => {
    const lock = buildLock({
      sourceUrl: 'https://x/frontend.yaml',
      contractText: 'openapi: 3.1.0',
      backendMeta: { version: '2026-08-01' },
    });
    expect(lock.backendMeta).toEqual({ version: '2026-08-01' });
  });
});

describe('verifyContract', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'contract-core-test-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('devuelve status "error" (no "missing") si no existe el contrato local', () => {
    const result = verifyContract({
      contractPath: path.join(dir, 'frontend.yaml'),
      lockPath: path.join(dir, 'contract-lock.json'),
      cliBin: CLI_BIN,
    });
    expect(result.status).toBe('error');
    expect(result.reason).toMatch(/no existe/i);
    expect(result.reason).toMatch(/contract:fetch/);
  });

  it('devuelve status "error" si falta el lock file', () => {
    const contractPath = path.join(dir, 'frontend.yaml');
    writeFileSync(contractPath, readFileSync(FIXTURE, 'utf8'));

    const result = verifyContract({
      contractPath,
      lockPath: path.join(dir, 'contract-lock.json'),
      cliBin: CLI_BIN,
    });
    expect(result.status).toBe('error');
    expect(result.reason).toMatch(/falta/i);
  });

  it('devuelve status "error" si el hash no coincide con el lock (edición a mano)', () => {
    const contractPath = path.join(dir, 'frontend.yaml');
    const lockPath = path.join(dir, 'contract-lock.json');
    const contractText = readFileSync(FIXTURE, 'utf8');
    writeFileSync(contractPath, contractText);
    writeFileSync(
      lockPath,
      JSON.stringify(
        buildLock({ sourceUrl: 'https://x/frontend.yaml', contractText: 'texto-distinto' })
      )
    );

    const result = verifyContract({ contractPath, lockPath, cliBin: CLI_BIN });
    expect(result.status).toBe('error');
    expect(result.reason).toMatch(/no coincide/i);
  });

  it('devuelve status "error" si el contrato no es un OpenAPI generable', () => {
    const contractPath = path.join(dir, 'frontend.yaml');
    const lockPath = path.join(dir, 'contract-lock.json');
    const contractText = 'esto: no es openapi\n  - roto: [';
    writeFileSync(contractPath, contractText);
    writeFileSync(
      lockPath,
      JSON.stringify(buildLock({ sourceUrl: 'https://x/frontend.yaml', contractText }))
    );

    const result = verifyContract({ contractPath, lockPath, cliBin: CLI_BIN });
    expect(result.status).toBe('error');
  });

  it('devuelve status "ok" cuando el contrato coincide con el lock y es válido (sin generatedPath)', () => {
    const contractPath = path.join(dir, 'frontend.yaml');
    const lockPath = path.join(dir, 'contract-lock.json');
    const contractText = readFileSync(FIXTURE, 'utf8');
    writeFileSync(contractPath, contractText);
    writeFileSync(
      lockPath,
      JSON.stringify(buildLock({ sourceUrl: 'https://x/frontend.yaml', contractText }))
    );

    const result = verifyContract({ contractPath, lockPath, cliBin: CLI_BIN });
    expect(result.status).toBe('ok');
    expect(result.lock?.contractHash).toBe(sha256(contractText));
  });

  it('devuelve status "error" si se pide generatedPath y los tipos generados no existen', () => {
    const contractPath = path.join(dir, 'frontend.yaml');
    const lockPath = path.join(dir, 'contract-lock.json');
    const contractText = readFileSync(FIXTURE, 'utf8');
    writeFileSync(contractPath, contractText);
    writeFileSync(
      lockPath,
      JSON.stringify(buildLock({ sourceUrl: 'https://x/frontend.yaml', contractText }))
    );

    const result = verifyContract({
      contractPath,
      lockPath,
      generatedPath: path.join(dir, 'generated', 'api.d.ts'),
      cliBin: CLI_BIN,
    });
    expect(result.status).toBe('error');
    expect(result.reason).toMatch(/no existen tipos generados/i);
  });

  it('devuelve status "error" si los tipos generados están desactualizados respecto al contrato', () => {
    const contractPath = path.join(dir, 'frontend.yaml');
    const lockPath = path.join(dir, 'contract-lock.json');
    const generatedPath = path.join(dir, 'generated', 'api.d.ts');
    const contractText = readFileSync(FIXTURE, 'utf8');
    writeFileSync(contractPath, contractText);
    writeFileSync(
      lockPath,
      JSON.stringify(buildLock({ sourceUrl: 'https://x/frontend.yaml', contractText }))
    );
    mkdirSync(path.dirname(generatedPath), { recursive: true });
    writeFileSync(
      generatedPath,
      withBanner('export interface paths {} // versión vieja, a propósito')
    );

    const result = verifyContract({ contractPath, lockPath, generatedPath, cliBin: CLI_BIN });
    expect(result.status).toBe('error');
    expect(result.reason).toMatch(/desactualizado/i);
  });

  it('devuelve status "ok" cuando los tipos generados coinciden bit a bit con regenerar ahora', () => {
    const contractPath = path.join(dir, 'frontend.yaml');
    const lockPath = path.join(dir, 'contract-lock.json');
    const generatedPath = path.join(dir, 'generated', 'api.d.ts');
    const contractText = readFileSync(FIXTURE, 'utf8');
    writeFileSync(contractPath, contractText);
    writeFileSync(
      lockPath,
      JSON.stringify(buildLock({ sourceUrl: 'https://x/frontend.yaml', contractText }))
    );

    // Genera los tipos "reales" exactamente como lo haría contract:generate.
    mkdirSync(path.dirname(generatedPath), { recursive: true });
    const genResult = runOpenApiTypeScript({
      cliBin: CLI_BIN,
      inputPath: contractPath,
      outputPath: generatedPath,
      extraArgs: ['--alphabetize'],
    });
    expect(genResult.success).toBe(true);
    writeFileSync(generatedPath, withBanner(readFileSync(generatedPath, 'utf8')));

    const result = verifyContract({ contractPath, lockPath, generatedPath, cliBin: CLI_BIN });
    expect(result.status).toBe('ok');
  });
});

describe('pipeline de generación end-to-end (fixture)', () => {
  it('genera tipos TypeScript usables desde la fixture', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'contract-generate-test-'));
    try {
      const outDir = path.join(dir, 'generated');
      mkdirSync(outDir, { recursive: true });
      const outFile = path.join(outDir, 'api.d.ts');

      const result = runOpenApiTypeScript({
        cliBin: CLI_BIN,
        inputPath: FIXTURE,
        outputPath: outFile,
      });

      expect(result.success).toBe(true);
      const generated = readFileSync(outFile, 'utf8');
      expect(generated).toContain('FixtureCountry');
      expect(generated).toContain('FixturePaginationMeta');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
