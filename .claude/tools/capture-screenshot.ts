/**
 * Headless screenshot capture for the VISUAL audit mode (design-quality-auditor).
 *
 * Loads the saved session from auth-setup.ts (if present) so it can reach
 * authenticated views without re-running the OTP login flow. If the session is
 * missing or expired, it says so explicitly instead of silently screenshotting
 * the login page as if it were the requested view.
 *
 * Run (ephemeral deps via npx -p, nothing added to package.json):
 *   npx --yes -p playwright -p tsx tsx .claude/tools/capture-screenshot.ts \
 *     --url /admin/orders --out /tmp/orders.png --viewport desktop
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
  const out = arg('out');
  const viewportKey = (arg('viewport', 'desktop') as keyof typeof VIEWPORTS) ?? 'desktop';
  const baseUrl = arg('base-url', 'http://localhost:3000');
  const authPath = '.claude/tools/.auth/session.json';

  if (!path || !out) {
    console.error('Uso: --url /ruta --out /archivo.png [--viewport desktop|mobile] [--base-url http://localhost:3000]');
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

  const url = `${baseUrl}${path}`;
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  // Let TanStack Query settle past skeleton states after networkidle.
  await page.waitForTimeout(800);

  if (page.url().includes('/login')) {
    console.error(
      `Sesión inválida o caducada: ${url} redirigió a /login. ` +
        `Vuelve a ejecutar auth-setup.ts y reintenta. No se ha guardado ninguna captura.`
    );
    await browser.close();
    process.exit(2);
  }

  mkdirSync(dirname(out), { recursive: true });
  await page.screenshot({ path: out, fullPage: true });
  console.log(`OK: ${url} -> ${out} (${viewportKey})`);
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
