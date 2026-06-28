# GAP-023 — Extraer llamadas a /api/crm/improve-text a crmAiService.ts

## Metadata

- **Tipo:** Refactor
- **Módulo:** CRM
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-06-28
- **Autor:** Jose

---

## Contexto y problema

Tres componentes del módulo CRM llaman a `fetch('/api/crm/improve-text')` directamente
desde su cuerpo, violando la regla de la capa de servicios (PL-NEW-A de project-learnings.md):

| Componente | `kind` usado | Línea |
|---|---|---|
| `ResolveNextActionDialog.jsx` | `next_action_description` | 199 |
| `ProspectFormSheet.jsx` | `prospect_commercial_interest`, `prospect_notes` | 181 |
| `QuickInteractionModal.jsx` | `interaction_summary` | 203 |

La lógica es idéntica en los tres archivos: POST a `/api/crm/improve-text` con `{ kind, text }`,
parseo de `{ improvedText }` en la respuesta, y manejo de error con `notify.error`.

`/api/crm/improve-text` es una ruta interna de Next.js (OpenAI + `getServerSession`) —
no es el backend Laravel, por lo que **no pasa por `fetchWithTenant`**. Esto hace que
el servicio extraído sea distinto al `crmService.ts` existente (que sí usa `fetchWithTenant`
para hablar con Laravel).

La duplicación activa ya sumó 3 bloques de código de ~20 líneas cada uno que harán
divergir cuando el endpoint cambie (url, payload, manejo de errores).

## Solución acordada

1. Crear `src/services/crmAiService.ts` con una función `improveText(kind, text)` que
   encapsula la llamada a `/api/crm/improve-text`.
2. Los tres componentes dejan de llamar a `fetch()` directamente y usan `crmAiService.improveText()`.
3. Los tres archivos `.jsx` se migran a `.tsx` al tocarse (regla TS del proyecto).

El `crmService.ts` existente **no se toca** — mantiene su responsabilidad exclusiva
sobre las llamadas al backend Laravel.

## Referencias e inspiración

- PL-NEW-A (project-learnings.md): fetch() a rutas internas `/api/*` desde componentes
  debe extraerse a un service file.
- Regla de oro 1 (CLAUDE.md): nunca `fetch()` directo — todo pasa por la capa de servicio.
- Regla de oro 3 (CLAUDE.md): no archivos `.js` nuevos; al tocar `.jsx` legacy, migrar a `.tsx`.
- Precedente: `src/app/api/extraction/chatgpt/route.js` tiene su propio servicio separado
  del backend Laravel.

## Criterios de aceptación

- [ ] Existe `src/services/crmAiService.ts` con función exportada `improveText(kind: CrmTextKind, text: string): Promise<string>`
- [ ] `CrmTextKind` está tipado como unión de los 4 values: `'interaction_summary' | 'next_action_description' | 'prospect_commercial_interest' | 'prospect_notes'`
- [ ] `crmAiService.improveText` lanza un `Error` con el `error` del payload si `response.ok === false`
- [ ] `crmAiService.improveText` lanza un `Error` si `improvedText` es vacío tras el trim
- [ ] `ResolveNextActionDialog.tsx` usa `crmAiService.improveText` — sin `fetch()` inline
- [ ] `ProspectFormSheet.tsx` usa `crmAiService.improveText` — sin `fetch()` inline
- [ ] `QuickInteractionModal.tsx` usa `crmAiService.improveText` — sin `fetch()` inline
- [ ] Los 3 componentes migrados de `.jsx` a `.tsx` (sin añadir tipos a todo — solo renombrar y ajustar lo que TypeScript marque como error)
- [ ] Los 3 archivos `.jsx` originales eliminados
- [ ] Sin `any` sin justificación en el service nuevo
- [ ] `npm run build` pasa sin errores

## Archivos a crear o modificar

**Crear:**
- `src/services/crmAiService.ts` — nuevo service con `improveText`

**Modificar (migrar de .jsx a .tsx):**
- `src/components/Comercial/CRM/ResolveNextActionDialog.jsx` → `.tsx`
- `src/components/Comercial/CRM/ProspectFormSheet.jsx` → `.tsx`
- `src/components/Comercial/CRM/QuickInteractionModal.jsx` → `.tsx`

**Eliminar:**
- Los 3 archivos `.jsx` originales (sustituidos por sus `.tsx`)

## Restricciones

- `crmService.ts` no se toca — responsabilidad exclusiva del backend Laravel.
- `src/app/api/crm/improve-text/route.js` no se toca — solo el cliente cambia.
- No añadir tipos exhaustivos a los 3 componentes migrados — solo los tipos mínimos
  que TypeScript exija al renombrar a `.tsx`. El refactor de tipado completo queda
  para un GAP posterior.
- No cambiar la lógica de negocio ni el comportamiento visible de los componentes.
- No añadir stubs de test — queda fuera de scope de este GAP.

---

## Implementación

> Rellena el Agente Implementador

### Archivos creados

### Archivos modificados

### Decisiones tomadas durante la implementación

### Desviaciones del plan (si las hay)

---

## Auditoría

> Rellena el Agente Auditor

### Resultado: ✅ APROBADO | ⚠️ APROBADO CON OBSERVACIONES | ❌ RECHAZADO

### Puntuación: [X/10]

### Checklist

- [ ] Criterios de aceptación cumplidos
- [ ] Sin fetch() directo
- [ ] Sin hardcode de tenant
- [ ] Sin archivos .js nuevos
- [ ] Sin any sin justificación
- [ ] Hooks gigantes no tocados sin permiso
- [ ] entitiesConfig.js no tocado sin permiso
- [ ] Patrones de .claude/rules/ respetados
- [ ] Nomenclatura correcta

### Observaciones para Jose

### Estado final de la implementación
