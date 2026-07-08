# Comando: /design-to-code

## Uso
```
/design-to-code [vista] [fuente opcional]
/design-to-code audit [vista]
```

## Ejemplos
```
/design-to-code pedidos-mobile
/design-to-code dashboard-comercial .claude/design-imports/dashboard-comercial/source.html
/design-to-code audit pedidos-mobile
```

## Qué hace este comando

1. Carga el skill `design-to-code` desde `.claude/skills/design-to-code/SKILL.md`
2. Ejecuta el **PASO 0** (localizar la fuente del diseño: repo sembrado por
   "Send to Claude Code Web", `DesignSync` en contexto local, o archivo/enlace
   dado por Jose) y el **PASO A** (extraer el Design Brief)
3. Presenta el **PASO B** (mapeo de fidelidad vs adaptación) — espera
   confirmación explícita antes de escribir ningún código
4. Tras confirmación, delega la implementación (**PASO C**) a `mobile-ui-agent`
   (vistas mobile) o `frontend-developer` (vistas desktop / CRUD genérico)
5. Al terminar, invoca `design-fidelity-auditor` (**PASO D**) para comparar el
   resultado contra el mockup original y clasificar cada diferencia como
   ✅ Fiel / ⚠️ Adaptado acordado / ❌ Drift
6. Cierra con el resumen del **PASO E**

`/design-to-code audit [vista]` re-ejecuta solo el PASO D sobre una vista ya
implementada — útil tras aplicar fixes de un ❌ DRIFT sin repetir todo el flujo.

---

## Aliases reconocidos

| Comando | Acción |
|---------|--------|
| `/design-to-code [vista] [fuente]` | Iniciar el circuito completo para una vista |
| `/design-to-code audit [vista]` | Re-ejecutar solo la auditoría de fidelidad (PASO D) |

---

## Flujo típico de una sesión

```
1. Jose diseña la pantalla en claude.ai/design y pulsa "Send to Claude Code Web"
   (o exporta/pega el HTML si estamos en contexto local con /design-login)

2. /design-to-code [vista]
   → Claude localiza la fuente, extrae el Design Brief
   → Claude propone el mapeo de fidelidad vs adaptación

3. Jose confirma o ajusta el mapeo

4. Claude implementa (delegado a mobile-ui-agent / frontend-developer)
   → si es mobile en contexto CLOUD: rama mobile/[vista] + ruta /preview,
     igual que en /mobile

5. Claude audita fidelidad automáticamente (design-fidelity-auditor)
   → si hay ❌ DRIFT, corrige solo esos puntos y repite el PASO D

6. Jose prueba en móvil real o DevTools

7. "merge [vista]"   ← cuando está listo (igual que /mobile merge)
```

---

## Notas

- Si la vista es mobile o tiene capa mobile, el flujo de ramas
  `mobile/[vista]` + `/preview` de `mobile-preview/SKILL.md` sigue aplicando
  tal cual — este comando no lo reemplaza, lo antecede
- Vistas de cierta complejidad (multi-pantalla, entidad nueva, flujo con
  varios pasos) requieren un GAP primero vía `gap-discovery`; una pantalla
  puntual no lo requiere
- Este comando NUNCA hace merge automáticamente — siempre espera instrucción
  explícita, igual que `/mobile`
- Nunca copiar CSS/HTML del mockup literal — el objetivo es fidelidad de
  composición y copy, no fidelidad de implementación técnica del export
