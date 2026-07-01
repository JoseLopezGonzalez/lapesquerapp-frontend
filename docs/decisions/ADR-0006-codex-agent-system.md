# ADR-0006 — Codex and Cross-Tool Agent System Adapter

## Decision

Add a Codex-native adapter, Cursor/Copilot instruction adapters and a
tool-neutral agent system layer without removing or modifying the existing
Claude Code system.

## Type

technical

## Context

La PesquerApp already has a mature Claude Code ecosystem with agents, commands,
skills, GAPs, project learnings and UI design context. Codex, Cursor and Copilot
need equivalent behavior, but relying directly on `.claude/**` would make other
tools fragile and keep Claude-specific files as the only source of truth.

## Reason

A neutral layer lets the project gradually standardize agent behavior across
tools while keeping current Claude Code workflows stable. Codex receives
first-class skills in `.agents/skills/`; Cursor receives `.cursor/rules/`
adapters; Copilot receives `.github/instructions/` adapters. GAP, code audit,
UI audit, design audit, mobile, ideas and memory workflows all point to
`docs/agent-system/` rather than duplicating long protocols.

## Alternatives considered

- Tell Codex to read `.claude/**` directly: fast, but tool-coupled and fragile.
- Copy all Claude files into Codex skills: works initially, but creates
  duplicated instructions that will drift.
- Only update Codex and ignore Cursor/Copilot: useful for one tool, but not
  enough for the desired cross-model behavior.
- Migrate Claude immediately to the neutral layer: cleaner long term, but too
  risky for the first Codex adapter.

## Impact

- Codex, Cursor and Copilot can discover GAP, audit, mobile, ideas and memory
  workflows.
- `.claude/**` remains untouched and operational for Claude Code.
- Future work can progressively move Claude, Cursor and Copilot to the neutral
  layer.

## Date

2026-07-01

## Status

accepted
