# GUÍA RÁPIDA: IMPLEMENTAR SISTEMA DE MEMORIA EN TUS AGENTES IA

---

## ⚡ 3 PASOS (YA HECHOS EN ESTE PROYECTO)

1. **Carpeta de estándares**: `.ai_standards/` (ya existe).
2. **Documentos base**: `AGENT_MEMORY_SYSTEM.md` y `COLETILLA_PROTOCOLO_MEMORIA.md` (ya en `.ai_standards/`).
3. **En cada prompt**: Añade la coletilla al final o referencia `@.ai_standards/AGENT_MEMORY_SYSTEM.md`.

---

## 🎯 USO EN CURSOR

### Opción A — Referencia directa (recomendada)

En el chat escribe por ejemplo:

```
[Tu tarea aquí]

@.ai_standards/AGENT_MEMORY_SYSTEM.md aplica el protocolo de memoria.
```

### Opción B — Coletilla en el prompt

Copia al final de tu prompt el bloque "PROTOCOLO DE MEMORIA DE TRABAJO ESTÁNDAR" de `COLETILLA_PROTOCOLO_MEMORIA.md`.

### Opción C — Regla del proyecto

El proyecto tiene una regla en `.cursor/rules/` que recuerda al agente usar este sistema en tareas complejas; aun así puedes decir: "Sigue el AGENT_MEMORY_SYSTEM".

---

## 📁 DÓNDE ESTÁ TODO

| Qué                          | Dónde                                                     |
| ---------------------------- | --------------------------------------------------------- |
| Documento maestro            | `.ai_standards/AGENT_MEMORY_SYSTEM.md`                    |
| Coletilla para prompts       | `.ai_standards/COLETILLA_PROTOCOLO_MEMORIA.md`            |
| Esta guía                    | `.ai_standards/QUICK_START_GUIDE.md`                      |
| Sesiones del agente          | `.ai_work_context/[TIMESTAMP]/`                           |
| Reporte final de cada sesión | `.ai_work_context/[TIMESTAMP]/05_outputs/FINAL_REPORT.md` |

---

## 🚀 FLUJO RESUMIDO

1. Tú pasas prompt (+ referencia a memoria si quieres).
2. El agente carga `AGENT_MEMORY_SYSTEM.md`, crea `.ai_work_context/[TIMESTAMP]/`.
3. El agente trabaja documentando en 01_analysis, 02_planning, 03_execution, 04_logs.
4. Si hay decisión crítica → pausa y pregunta; tú respondes; continúa.
5. Al terminar: borra 00_working/, genera `05_outputs/FINAL_REPORT.md`, entrega la carpeta.

---

## ✨ COMANDOS ÚTILES

```bash
# Ver última sesión
ls -lt .ai_work_context | head -5

# Ver último reporte final
cat $(ls -td .ai_work_context/*/ 2>/dev/null | head -1)05_outputs/FINAL_REPORT.md

# Ver decisiones pendientes (si las hay)
cat .ai_work_context/*/00_working/decisions_pending.md 2>/dev/null
```

---

Para más detalle: `AGENT_MEMORY_SYSTEM.md` en esta misma carpeta.
