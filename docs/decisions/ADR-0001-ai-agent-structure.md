# ADR-0001 — AI Agent Structure

## Decision

The frontend repository will include persistent instructions and context files for AI agents.

## Reason

AI-assisted development is becoming part of the workflow. To avoid repeated explanations, inconsistent outputs and unsafe changes, the repository must provide structured context for agents.

## Files added

- `AGENTS.md`
- `CLAUDE.md`
- `.cursor/rules/`
- `.github/copilot-instructions.md`
- `.github/instructions/`
- `docs/ai-context/`
- `docs/agents/`
- `docs/templates/`

## Impact

Agents can work with clearer context and fewer repeated explanations.

## Date

2026-04-26

## Status

accepted
