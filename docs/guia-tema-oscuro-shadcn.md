# Guía del Tema Oscuro (Shadcn)

Documentación de los ajustes del tema oscuro de Shadcn UI y cómo modificarlo o revertirlo.

## Cambio aplicado

Se suavizó el tema oscuro para que sea menos intenso y más agradable a la vista. Los valores HSL de luminosidad fueron aumentados para lograr un gris más claro en vez de un negro casi puro.

### Archivo afectado

- `src/app/globals.css` — bloque `.dark` dentro de `@layer base`

### Valores antes y después

| Variable | Antes | Después |
|----------|-------|---------|
| `--background` | 6% | 11% |
| `--foreground` | 98% | 95% |
| `--card` | 7% | 13% |
| `--popover` | 7% | 13% |
| `--secondary` | 15% | 18% |
| `--muted` | 22% | 24% |
| `--muted-foreground` | 49% | 55% |
| `--accent` | 15% | 18% |
| `--border` | 12% | 18% |
| `--input` | 18% | 22% |
| `--ring` | 40% | 45% |
| `--sidebar-background` | 7% | 12% |

---

## Cómo modificar el tema en el futuro

### Formato de las variables

Las variables usan valores HSL en el formato: `hue sat% lightness%`

- **Hue** (0–360): matiz del color (0 = rojo, 120 = verde, 240 = azul)
- **Saturation** (0–100%): saturación (0% = gris puro)
- **Lightness** (0–100%): luminosidad — **este es el valor que controla si el tema es más o menos oscuro**

Para el tema oscuro, los colores son grises neutros (`0 0% X%`), así que solo importa el tercer número.

### Reglas prácticas

- **Tema más claro (menos oscuro)**: sube los porcentajes (ej. `11%` → `14%` o `16%`)
- **Tema más oscuro**: baja los porcentajes (ej. `11%` → `8%` o `6%`)
- Mantén proporciones razonables: por ejemplo, `--card` algo más claro que `--background`, y `--muted` más claro que `--secondary`.

### Dónde editar

1. Abre `src/app/globals.css`
2. Localiza el bloque `.dark` dentro de `@layer base` (aprox. líneas 189–280)
3. Modifica los valores del tercer número de cada variable (la luminosidad en %)

---

## Cómo revertir al estado original

Sustituye el bloque `.dark` actual por estos valores para recuperar el tema oscuro por defecto de Shadcn:

```css
.dark {
  --background: 0 0% 6%;
  --foreground: 0 0% 98%;

  --card: 0 0% 7%;
  --card-foreground: 0 0% 98%;

  --popover: 0 0% 7%;
  --popover-foreground: 0 0% 98%;

  --primary: 0 0% 100%;
  --primary-foreground: 0 0% 2%;

  --secondary: 0 0% 15%;
  --secondary-foreground: 0 0% 98%;

  --muted: 0 0% 22%;
  --muted-foreground: 0 0% 49%;

  --accent: 0 0% 15%;
  --accent-foreground: 0 0% 98%;

  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 98%;

  --border: 0 0% 12%;
  --input: 0 0% 18%;
  --ring: 0 0% 40%;
}
```

Y en el bloque de **sidebar** (`.dark` dentro de la sección Sidebar):

```css
--sidebar-background: 0 0% 7%;
```

---

## Referencia rápida

| Sensación deseada | Acción aproximada |
|-------------------|-------------------|
| Tema más claro | Subir todos los % en +3 a +5 puntos |
| Tema más oscuro | Bajar todos los % en -3 a -5 puntos |
| Mayor contraste de bordes | Subir `--border` y `--input` |
| Texto más legible | Subir `--muted-foreground` (55% → 60%) |
| Cards más definidas | Subir `--card` respecto a `--background` |
