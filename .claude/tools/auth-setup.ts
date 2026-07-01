/**
 * One-time (or per-expiry) manual login helper for the VISUAL audit mode.
 *
 * PesquerApp login is email + OTP (magic code), not password-based, so it cannot be
 * scripted end-to-end without access to the inbox. Instead this opens a REAL headed
 * browser, Jose logs in by hand (types email, reads the OTP from his inbox, types it),
 * and once the app redirects away from /login we snapshot cookies + localStorage
 * (Playwright "storageState") so future headless runs can skip login entirely.
 *
 * Run (ephemeral deps via npx -p, nothing added to package.json):
 *   npx --yes -p playwright -p tsx tsx .claude/tools/auth-setup.ts [baseUrl]
 *
 * Requires the Playwright browser binary once:
 *   npx --yes -p playwright playwright install chromium
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const baseUrl = process.argv[2] ?? 'http://localhost:3000';
const outPath = '.claude/tools/.auth/session.json';

async function main() {
  console.log(`Abriendo navegador contra ${baseUrl} ...`);
  console.log('Inicia sesión a mano (email + código OTP de tu correo).');
  console.log('En cuanto la URL deje de ser /login, esta ventana se cierra sola.\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });

  const deadlineMs = Date.now() + 5 * 60 * 1000; // 5 min to complete OTP by hand
  while (Date.now() < deadlineMs) {
    if (!page.url().includes('/login')) break;
    await page.waitForTimeout(1000);
  }

  if (page.url().includes('/login')) {
    console.error('\nTimeout: seguía en /login a los 5 minutos. Nada guardado. Reintenta.');
    await browser.close();
    process.exit(1);
  }

  mkdirSync(dirname(outPath), { recursive: true });
  await context.storageState({ path: outPath });
  console.log(`\nSesión guardada en ${outPath}. Ya puedes usar capture-screenshot.ts.`);
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
