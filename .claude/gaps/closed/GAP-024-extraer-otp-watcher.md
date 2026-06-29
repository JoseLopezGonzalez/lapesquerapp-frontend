# GAP-024 — Extraer OtpWatcher para eliminar eslint-disable rules-of-hooks

## Metadata

- **Tipo:** Refactor
- **Módulo:** Global (Login)
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-06-28
- **Autor:** Jose

---

## Contexto y problema

`LoginFormContent.tsx` llama a `useWatch` condicionalmente (líneas 76-80), lo que viola
la regla de React "Rules of Hooks" y requiere un `eslint-disable` para silenciar la alerta:

```tsx
/* eslint-disable react-hooks/rules-of-hooks -- otpControl is stable at mount;
   proper fix requires extracting an OtpWatcher sub-component */
const otpCode = otpControl
  ? useWatch({ control: otpControl, name: 'code', defaultValue: '' })
  : '';
/* eslint-enable react-hooks/rules-of-hooks */
```

El propio comentario documenta la solución correcta: extraer un sub-componente.
Este es el anti-patrón PL-002 registrado en `project-learnings.md`.

`eslint-disable` es **nunca** aceptable como solución permanente para violations de
rules-of-hooks (PL-002). El `eslint-disable` activo implica que el linter no protege
este archivo frente a futuros errores similares.

## Solución acordada

Extraer un sub-componente local `OtpWatcher` en el mismo archivo `LoginFormContent.tsx`
que llama a `useWatch` de forma incondicional y notifica al padre cuándo el código
está completo mediante una prop `onChange`.

```tsx
// Sub-componente local (no exportado) — mismo archivo
interface OtpWatcherProps {
  control: Control<LoginOtpForm>;
  onChange: (isComplete: boolean) => void;
}

function OtpWatcher({ control, onChange }: OtpWatcherProps) {
  const code = useWatch({ control, name: 'code', defaultValue: '' });
  const isComplete = (code?.length ?? 0) === 6;
  useEffect(() => { onChange(isComplete); }, [isComplete, onChange]);
  return null;
}
```

En `LoginFormContent`:
- Eliminar las líneas 76-80 (el `useWatch` condicional + los `eslint-disable`)
- Añadir `const [isOtpComplete, setIsOtpComplete] = useState(false)`
- Renderizar `{otpControl && <OtpWatcher control={otpControl} onChange={setIsOtpComplete} />}`
  junto al bloque OTP existente

## Referencias e inspiración

- PL-002 (project-learnings.md): eslint-disable para rules-of-hooks nunca es solución permanente.
- Regla rules/components.md: lógica extraída a sub-componentes cuando el componente padre la necesita.
- El comentario en la línea 76 ya nombra explícitamente esta solución.

## Criterios de aceptación

- [ ] `LoginFormContent.tsx` no contiene ningún `eslint-disable` / `eslint-enable`
- [ ] `useWatch` no se llama condicionalmente en ningún punto del archivo
- [ ] Existe sub-componente local `OtpWatcher` en el mismo archivo (no exportado)
- [ ] `OtpWatcher` llama a `useWatch` incondicionalmente
- [ ] El botón "Verificar código" sigue desactivado hasta que el OTP tenga 6 dígitos
- [ ] El comportamiento visual del formulario de login es idéntico al actual
- [ ] `npm run build` pasa sin errores
- [ ] `npm run lint` pasa sin warnings en `LoginFormContent.tsx`

## Archivos a crear o modificar

**Modificar:**
- `src/components/LoginPage/LoginFormContent.tsx` — extraer `OtpWatcher`, eliminar eslint-disable

No se crean archivos nuevos — `OtpWatcher` es un sub-componente local no exportado.

## Restricciones

- No cambiar el comportamiento visible del formulario de login
- No cambiar el contrato de props de `LoginFormContent` (`LoginFormContentProps`)
- No exportar `OtpWatcher` — es un detalle de implementación interno
- No tocar otros archivos del módulo Login sin avisar

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
