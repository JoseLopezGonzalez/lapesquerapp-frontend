#!/usr/bin/env node
// Regenerates docs/ai/modules/{module}/gaps-registry.md from the YAML
// frontmatter of every GAP in docs/ai/gaps/{module}/*.md.
//
// Usage: node scripts/build-gaps-registry.mjs <module>
//
// Plain .mjs (not .ts) on purpose, same as the existing
// scripts/generate-generic-icons.js: standalone scripts run outside the
// Next.js build with plain `node`, and adding a TS runner (ts-node/tsx)
// here would be a new dependency for a single script. The `.js` vs `.ts`
// rule in CLAUDE.md targets application code under src/.

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const moduleSlug = process.argv[2];

if (!moduleSlug) {
  console.error('Usage: node scripts/build-gaps-registry.mjs <module>');
  process.exit(1);
}

const root = process.cwd();
const gapsDir = path.join(root, 'docs/ai/gaps', moduleSlug);
const moduleDir = path.join(root, 'docs/ai/modules', moduleSlug);
const registryPath = path.join(moduleDir, 'gaps-registry.md');

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const lines = match[1].split('\n');
  const data = {};
  let currentKey = null;

  for (const line of lines) {
    const blockItem = line.match(/^\s+-\s+(.*)$/);
    if (blockItem && currentKey) {
      data[currentKey] = data[currentKey] || [];
      data[currentKey].push(blockItem[1].trim());
      continue;
    }

    const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (!kv) continue;

    const [, key, rawValue] = kv;
    const value = rawValue.trim();

    if (value === '' ) {
      // Could be a block array on following lines, or an empty scalar.
      currentKey = key;
      data[key] = data[key] ?? undefined;
      continue;
    }

    currentKey = null;
    if (value === '[]') {
      data[key] = [];
    } else if (value.startsWith('[') && value.endsWith(']')) {
      data[key] = value
        .slice(1, -1)
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
    } else {
      data[key] = value;
    }
  }

  return data;
}

function loadGaps(dir) {
  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((file) => {
      const raw = readFileSync(path.join(dir, file), 'utf8');
      const fm = parseFrontmatter(raw);
      if (!fm) {
        console.warn(`⚠️  ${file} no tiene frontmatter válido — omitido del registry`);
        return null;
      }
      return { ...fm, file };
    })
    .filter(Boolean);
}

function priorityRank(p) {
  const order = { P0: 0, P1: 1, P2: 2, P3: 3, P4: 4 };
  return order[p] ?? 99;
}

function sortGaps(gaps) {
  return [...gaps].sort(
    (a, b) => priorityRank(a.priority) - priorityRank(b.priority) || (a.id || '').localeCompare(b.id || '')
  );
}

function renderTable(gaps) {
  if (gaps.length === 0) return '_ninguno_\n';

  const header = '| GAP | Título | Categoría | Prioridad | Riesgo | Tamaño | Dependencias | Archivos objetivo | Actualizado |\n' +
    '|---|---|---|---|---|---|---|---|---|\n';

  const rows = sortGaps(gaps)
    .map((g) => {
      const deps = Array.isArray(g.dependencies) && g.dependencies.length ? g.dependencies.join(', ') : '—';
      const files = Array.isArray(g.target_files) && g.target_files.length ? g.target_files.join('<br>') : '—';
      return `| ${g.id || '?'} | ${g.title || '?'} | ${g.category || '?'} | ${g.priority || '?'} | ${g.risk || '?'} | ${g.size || '?'} | ${deps} | ${files} | ${g.updated_at || '?'} |`;
    })
    .join('\n');

  return header + rows + '\n';
}

const gaps = loadGaps(gapsDir);

const groups = {
  ready: gaps.filter((g) => g.status === 'ready'),
  in_progress: gaps.filter((g) => g.status === 'in_progress'),
  blocked: gaps.filter((g) => g.status === 'blocked'),
  done: gaps.filter((g) => g.status === 'done'),
  later: gaps.filter((g) => g.status === 'later'),
};

const known = new Set(Object.values(groups).flat().map((g) => g.file));
const other = gaps.filter((g) => !known.has(g.file));

const now = new Date().toISOString().slice(0, 10);

const content = `# ${moduleSlug} — GAPs Registry

> **GENERADO por \`node scripts/build-gaps-registry.mjs ${moduleSlug}\`. No editar a mano.**
> Última regeneración: ${now}
> Fuente: frontmatter de \`docs/ai/gaps/${moduleSlug}/*.md\`

## Ready

${renderTable(groups.ready)}

## In progress

${renderTable(groups.in_progress)}

## Blocked

${renderTable(groups.blocked)}

## Done

${renderTable(groups.done)}

## Later

${renderTable(groups.later)}
${other.length ? `\n## Sin clasificar (status distinto de ready/in_progress/blocked/done/later)\n\n${renderTable(other)}\n` : ''}
`;

mkdirSync(moduleDir, { recursive: true });
writeFileSync(registryPath, content, 'utf8');

console.log(`✅ ${registryPath}`);
console.log(
  `   ready: ${groups.ready.length} · in_progress: ${groups.in_progress.length} · blocked: ${groups.blocked.length} · done: ${groups.done.length} · later: ${groups.later.length}${other.length ? ` · sin clasificar: ${other.length}` : ''}`
);
