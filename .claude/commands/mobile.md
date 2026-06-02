# Comando: /mobile

## Uso
```
/mobile [nombre de la vista o ruta]
```

## Ejemplos
```
/mobile pedidos
/mobile /admin/stores-manager
/mobile especies          (CRUD catálogo genérico)
/mobile autoventa
/mobile clientes
/mobile supplier-liquidations
```

## Qué hace este comando

1. Carga el skill `mobile-ui` (patrones y restricciones del proyecto)
2. Carga el skill `mobile-preview` (flujo de ramas)
3. Si es CRUD simple, carga también `mobile-crud-generator`
4. Ejecuta el **PASO A** (investigación de la vista actual)
5. Presenta el **PASO B** (análisis y propuesta) — espera confirmación antes de codificar

---

## Aliases reconocidos

| Comando | Acción |
|---------|--------|
| `/mobile [vista]` | Iniciar trabajo en una vista |
| `/mobile merge [vista]` | Hacer merge de la rama `mobile/[vista]` a la rama base, eliminar ruta `/preview`, actualizar inventario |
| `/mobile status` | Listar ramas `mobile/*` activas y su estado en el inventario |
| `/mobile qa [vista]` | Pasar QA checklist de la vista indicada |
| `/mobile list` | Mostrar inventario completo de `.claude/mobile-inventory.md` |

---

## Flujo típico de una sesión

```
1. /mobile [vista]
   → Claude investiga el estado actual
   → Claude propone estructura y componentes

2. Usuario confirma o ajusta la propuesta

3. Claude implementa (PASO C)
   → crea rama mobile/[vista]
   → crea componentes mobile
   → crea ruta /preview

4. Usuario prueba en móvil real o DevTools

5. /mobile merge [vista]   ← cuando está listo
   → Claude elimina /preview, hace merge, actualiza inventario
```

---

## Notas

- El comando NO hace merge automáticamente — siempre espera `/mobile merge [vista]`
- Si la vista es nueva (no existe código desktop), avisar a Jose antes de proceder
- El GAP workflow sigue activo — toda vista mobile de cierta complejidad debe tener su GAP
- Para vistas simples (una mejora puntual en AccordionBody), no es necesario GAP
