# ADR-0003 — Form System Rules

## Decision

Frontend forms must follow existing React Hook Form and Zod conventions where applicable.

## Reason

Forms are critical in La PesquerApp. Inconsistent form logic creates bugs, bad payloads and maintenance problems.

## Rules

- Inspect similar forms before implementing.
- Use existing input/select/combobox/date components.
- Keep default values explicit.
- Align payloads with backend expectations.
- Do not invent backend fields.
- Keep validation clear.

## Impact

Future forms should be more consistent and safer to modify.

## Date

2026-04-26

## Status

accepted
