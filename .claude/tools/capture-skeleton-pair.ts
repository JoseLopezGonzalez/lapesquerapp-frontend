/**
 * Headless skeleton-vs-loaded screenshot pair capture, for the SCREENSHOT
 * sub-mode of `skeleton-fidelity-auditor`.
 *
 * Unlike capture-screenshot.ts (which deliberately waits past the loading
 * state), this script needs the OPPOSITE: it stalls every API response until
 * a first screenshot of the skeleton is taken, then releases the stalled
 * requests and takes a second screenshot once the real data has rendered.
 * Both images come from the exact same navigation, so the DOM structure
 * (grid/flex, column count) is directly comparable frame-to-frame.
 *
 * Loads the saved session from auth-setup.ts (if present), same as
 * capture-screenshot.ts.
 *
 * Run (ephemeral deps via npx -p, nothing added to package.json):
 *   npx --yes -p playwright -p tsx tsx .claude/tools/capture-skeleton-pair.ts \
 *     --url /admin/orders \
 *     --out-skeleton /tmp/orders-skeleton.png \
 *     --out-loaded /tmp/orders-loaded.png \
 *     --viewport desktop
 *
 * Requires the Playwright browser binary once:
 *   npx --yes -p playwright playwright install chromium
 */
import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
} as const;

function arg(name: string, fallback?: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  return process.argv[idx + 1];
}

async function main() {
  const path = arg('url');
  const outSkeleton = arg('out-skeleton');
  const outLoaded = arg('out-loaded');
  const viewportKey = (arg('viewport', 'desktop') as keyof typeof VIEWPORTS) ?? 'desktop';
  const baseUrl = arg('base-url', 'http://localhost:3000');
  const stallGlob = arg('stall-pattern', '**/api-backend/**');
  const authPath = '.claude/tools/.auth/session.json';

  if (!path || !outSkeleton || !outLoaded) {
    console.error(
      'Uso: --url /ruta --out-skeleton /archivo.png --out-loaded /archivo.png ' +
        '[--viewport desktop|mobile] [--base-url http://localhost:3000] [--stall-pattern glob]'
    );
    process.exit(1);
  }

  const hasSession = existsSync(authPath);
  if (!hasSession) {
    console.warn('Aviso: no hay .claude/tools/.auth/session.json — solo se podrán capturar vistas públicas.');
    console.warn('Ejecuta antes: npx --yes -p playwright -p tsx tsx .claude/tools/auth-setup.ts');
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORTS[viewportKey],
    storageState: hasSession ? authPath : undefined,
  });
  const page = await context.newPage();

  // Stall every API call behind a gate so the app stays in isLoading long
  // enough to screenshot the skeleton, then release the gate to let the
  // real response land and the loaded UI render.
  let releaseStall: () => void = () => {};
  const stallGate = new Promise<void>((resolve) => {
    releaseStall = resolve;
  });
  await page.route(stallGlob, async (route) => {
    await stallGate;
    await route.continue();
  });

  const url = `${baseUrl}${path}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

  if (page.url().includes('/login')) {
    console.error(
      `Sesión inválida o caducada: ${url} redirigió a /login. ` +
        `Vuelve a ejecutar auth-setup.ts y reintenta. No se ha guardado ninguna captura.`
    );
    releaseStall();
    await browser.close();
    process.exit(2);
  }

  // Give the skeleton a moment to paint while requests sit behind the gate.
  await page.waitForTimeout(700);
  mkdirSync(dirname(outSkeleton), { recursive: true });
  await page.screenshot({ path: outSkeleton, fullPage: true });

  releaseStall();
  await page.unroute(stallGlob);
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(500);

  mkdirSync(dirname(outLoaded), { recursive: true });
  await page.screenshot({ path: outLoaded, fullPage: true });

  console.log(`OK: ${url}`);
  console.log(`  skeleton -> ${outSkeleton} (${viewportKey})`);
  console.log(`  loaded   -> ${outLoaded} (${viewportKey})`);
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
