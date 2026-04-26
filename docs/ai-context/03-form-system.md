# Form System — La PesquerApp

## Stack real de formularios

- **React Hook Form 7** — estado y submit de formularios
- **Zod 3** — validación con schemas (en formularios complejos y tipados)
- **Validación inline** — `validation` object en el config de campo (formularios EntityClient)

**Importante**: este proyecto **no usa el sistema `FormField`/`FormItem`/`FormLabel` de shadcn**. Se usa `register()` directo y `Controller` para campos custom.

---

## Patrón estándar de formulario

```javascript
const {
  register,
  handleSubmit,
  control,
  watch,
  reset,
  setError,
  setValue,
  formState: { errors, isSubmitting, isValid }
} = useForm({
  resolver: zodResolver(mySchema),     // si hay schema Zod
  defaultValues: { field1: "", field2: null },
  mode: "onChange",
});

// Campo de texto simple
<Input {...register("field_name", { required: "Campo requerido" })} />
{errors.field_name && <p className="text-red-400 text-xs pt-1">* {errors.field_name.message}</p>}

// Campo custom (DatePicker, Combobox, Select)
<Controller
  name="date"
  control={control}
  rules={{ required: "Fecha requerida" }}
  render={({ field: { onChange, value, onBlur } }) => (
    <DatePicker date={value} onChange={onChange} onBlur={onBlur} />
  )}
/>
{errors.date && <p className="text-red-400 text-xs pt-1">* {errors.date.message}</p>}

// Submit
<Button type="submit" disabled={isSubmitting}>
  {isSubmitting ? "Guardando..." : "Guardar"}
</Button>
```

---

## Tipos de campo disponibles en EntityClient (createForm)

| Tipo | Componente rendered | Cuándo usar |
|---|---|---|
| `text` | `<Input type="text">` | Texto libre |
| `email` | `<Input type="email">` | Emails |
| `number` | `<Input type="number">` | Números |
| `date` | `<DatePicker>` | Fechas sin hora |
| `datetime-local` | `<Input type="datetime-local">` | Fecha + hora |
| `select` | `<Select>` | Lista estática de opciones |
| `Autocomplete` | `<Combobox>` con fetch | Opciones de API |
| `textarea` | `<Textarea>` | Texto largo |
| `emailList` | `<emailListInput>` | Múltiples emails |

---

## Formularios con Zod

Cuando se usa `zodResolver`, el schema define tipos y validación:

```typescript
// src/schemas/ — schemas reutilizables
import { z } from "zod";

const orderCreateSchema = z.object({
  customer_id: z.number({ required_error: "Cliente requerido" }),
  planned_date: z.string().min(1, "Fecha requerida"),
  planned_products: z.array(z.object({
    product_id: z.number(),
    quantity: z.number().positive(),
    price: z.number().min(0),
  })).min(1, "Añadir al menos un producto"),
});

type OrderCreateForm = z.infer<typeof orderCreateSchema>;
```

---

## Arrays dinámicos de items (`useFieldArray`)

Para formularios con líneas dinámicas (pedidos, recepciones, etc.):

```javascript
const { fields, append, remove } = useFieldArray({
  control,
  name: "planned_products",
});

// Añadir línea
<Button type="button" onClick={() => append({ product_id: null, quantity: 1, price: 0 })}>
  Añadir producto
</Button>

// Renderizar líneas
{fields.map((field, index) => (
  <div key={field.id}>
    <Controller name={`planned_products.${index}.product_id`} ... />
    <Input {...register(`planned_products.${index}.quantity`)} type="number" />
    <Button type="button" onClick={() => remove(index)}>Eliminar</Button>
  </div>
))}
```

---

## Transformaciones de payload antes del submit

Los formularios aplican transformaciones antes de enviar al backend:

```javascript
// Fechas → formato backend
date: format(formData.date, 'yyyy-MM-dd')
datetime: datetimeLocalToIsoWithZone(formData.datetime)

// camelCase → snake_case para IDs de relación
// speciesId → species_id  (conversión explícita, no automática)

// Payload de tiendas
transformStoresPayload(formData)

// Split de cliente (datos entidad vs. asignación)
splitCustomerPayload(formData)
```

---

## Errores del backend en formularios (422)

Cuando el backend devuelve errores de validación (HTTP 422), mapear al formulario:

```javascript
// En el catch del submit:
if (error.status === 422 && errorData.errors) {
  setErrorsFrom422(setError, errorData.errors);
  // setErrorsFrom422 está en src/helpers/ o src/lib/
}
```

Esto mapea los errores de campo del backend directamente a los campos del formulario.

---

## Feedback al usuario

```javascript
// Importar notify (wrapper de sonner)
import { notify } from "@/lib/notify"; // o ruta equivalente

// En éxito
notify.success("Cliente creado correctamente");
onSuccess?.();   // callback para cerrar modal, refetch, etc.

// En error general
notify.error(getErrorMessage(errorData));
```

---

## Reglas para agentes

1. **Antes de implementar un formulario**, inspeccionar formularios similares en `src/components/`.
2. **No usar `FormField`/`FormItem` de shadcn** — este proyecto no sigue ese patrón.
3. **Usar `Controller`** para DatePicker, Combobox, Select, InputOTP, y cualquier componente custom.
4. **Usar `register()` directo** para inputs de texto, email, number, textarea.
5. **Errores**: siempre `<p className="text-red-400 text-xs pt-1">* {errors.X.message}</p>`.
6. **Fechas**: transformar siempre antes del submit — el backend espera `yyyy-MM-dd`.
7. **IDs de relación**: los campos de relación usan snake_case en el payload (`supplier_id`, `product_id`).
8. **Errores 422**: usar `setErrorsFrom422` para mapear errores de validación del backend.
9. **No inventar campos** que no existan en el backend — verificar en el servicio.
10. **Estado de submit**: siempre deshabilitar el botón con `disabled={isSubmitting}`.
