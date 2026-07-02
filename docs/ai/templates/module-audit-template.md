# {Módulo} — Auditoría

> Plantilla de `docs/ai/modules/{module}/audit.md`. Única fuente de estado del
> módulo — no crear `audit-v2.md`, `audit-final.md` ni variantes con fecha.
> Al repetir una auditoría: leer este archivo como baseline, no partir de cero.

## NEXT ACTION

```text
Ejecutar:
{comando sugerido}

Contexto:
{1-3 líneas de motivo}

Restricciones:
{qué no tocar / no repetir en la siguiente pasada}
```

---

## 1. Estado del módulo

```text
Estado general: not_started | auditing | ready_for_implementation | implementing |
                needs_verification | blocked | closed | stale

Funcional:        {estado}
UI:                {estado}
UX:                 {estado}
Código:              {estado}
Arquitectura:         {estado}
Responsive:            {estado}
Accesibilidad:           {estado}
Performance:               {estado}
Testing:                     {estado}
Documentación:                 {estado}

P0 abiertos: {n}   P1 abiertos: {n}   P2 abiertos: {n}   P3 abiertos: {n}

Estado de auditoría:      {not_started | in_progress | done}
Estado de implementación: {not_started | in_progress | done}
Estado de verificación:   {not_started | in_progress | done}
```

## 2. Cobertura

Superficies × carriles. Estados: `pending · partial · audited · needs_reaudit · not_applicable`.

| Superficie | ux-ui | code-quality | architecture-refactor | data-api | domain-business | a11y-responsive |
|---|---|---|---|---|---|---|
| listado | pending | pending | pending | pending | pending | pending |
| detalle | pending | pending | pending | pending | pending | pending |
| creación | pending | pending | pending | pending | pending | pending |
| edición | pending | pending | pending | pending | pending | pending |
| formularios | pending | pending | pending | pending | pending | pending |
| tablas/listados | pending | pending | pending | pending | pending | pending |
| estados loading | pending | pending | not_applicable | not_applicable | not_applicable | pending |
| estados empty | pending | pending | not_applicable | not_applicable | not_applicable | pending |
| estados error | pending | pending | not_applicable | pending | not_applicable | pending |
| estados success | pending | pending | not_applicable | pending | not_applicable | pending |
| permisos/roles | pending | not_applicable | pending | pending | not_applicable | not_applicable |
| integración API | not_applicable | pending | pending | pending | pending | not_applicable |
| validaciones | pending | pending | not_applicable | pending | pending | not_applicable |
| tipos/interfaces | not_applicable | pending | pending | pending | not_applicable | not_applicable |
| componentización | not_applicable | pending | pending | not_applicable | not_applicable | not_applicable |
| dominio de negocio | not_applicable | not_applicable | not_applicable | pending | pending | not_applicable |
| testing | not_applicable | pending | pending | pending | not_applicable | not_applicable |

## 3. Resumen ejecutivo

{2-4 líneas: qué se auditó en esta pasada, qué se encontró, qué queda pendiente}

## 4. Baseline anterior

{si es la primera auditoría: "Ninguna — primera pasada". Si no: resumen de la
auditoría previa y fecha}

## 5. Alcance del módulo

```text
Rutas:       {src/app/...}
Componentes: {src/components/Admin/...}
Hooks:        {src/hooks/...}
Services:      {src/services/domain/...}
Tipos:          {src/types/...}
```

## 6. Hallazgos vigentes

{lista de hallazgos con file:line, carril de origen, y si ya generó GAP}

## 7. GAPs generados/actualizados

{referencia a docs/ai/gaps/{module}/GAP-V2-*.md con estado tras normalizar}

## 8. GAPs resueltos o descartados

{histórico corto de esta pasada — no acumulativo infinito, solo lo relevante}

## 9. Bloqueos y riesgos

{qué impide avanzar, o qué riesgo detectado requiere decisión de Jose}

## 10. Decisiones tomadas

{decisiones explícitas de Jose durante esta pasada, con fecha}

## 11. Cambios desde la última auditoría

{qué cambió en el código del módulo desde el baseline anterior}

## 12. Instrucciones para retomar en otro chat/modelo

{qué necesita saber una sesión nueva que no está ya en las secciones anteriores}

## 13. Reglas específicas para futuras auditorías de este módulo

{convenciones o excepciones propias de este módulo que un auditor futuro debe conocer}

## Legacy references

| Legacy GAP (`.claude/gaps/`) | Estado legacy | Relación | Nota |
|---|---|---|---|
| | | | |
