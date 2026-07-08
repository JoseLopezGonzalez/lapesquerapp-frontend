/**
 * Headless screenshot capture for a raw Claude Design mockup (self-contained
 * HTML — images/fonts/styles inlined), used by design-fidelity-auditor to
 * capture the "before" side of a design-vs-implementation comparison.
 *
 * Unlike capture-screenshot.ts, this never touches the dev server or the
 * auth session — the file is loaded directly via file://, since a Claude
 * Design export has no backend and no login wall.
 *
 * Run (ephemeral deps via npx -p, nothing added to package.json):
 *   npx --yes -p playwright -p tsx tsx .claude/tools/capture-design-source.ts \
 *     --file .claude/design-imports/pedidos-mobile/source.html \
 *     --out .claude/tools/.audit-screenshots/pedidos-mobile-design-mobile.png \
 *     --viewport mobile
 */
import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

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
  const file = arg('file');
  const out = arg('out');
  const viewportKey = (arg('viewport', 'desktop') as keyof typeof VIEWPORTS) ?? 'desktop';

  if (!file || !out) {
    console.error('Uso: --file /ruta/al/mockup.html --out /archivo.png [--viewport desktop|mobile]');
    process.exit(1);
  }

  const absFile = resolve(file);
  if (!existsSync(absFile)) {
    console.error(`No existe el archivo de diseño: ${absFile}`);
    process.exit(2);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: VIEWPORTS[viewportKey] });
  const page = await context.newPage();

  const url = pathToFileURL(absFile).toString();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  // Let inlined webfonts/canvas settle even though there's no real network activity.
  await page.waitForTimeout(300);

  mkdirSync(dirname(out), { recursive: true });
  await page.screenshot({ path: out, fullPage: true });
  console.log(`OK: ${url} -> ${out} (${viewportKey})`);
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
