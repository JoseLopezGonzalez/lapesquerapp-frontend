# Formularios - React Hook Form y Validaciones

## 📚 Documentación Relacionada

- **[04-components-admin.md](./04-components-admin.md)** - Componentes que utilizan formularios
- **[05-hooks-personalizados.md](./05-hooks-personalizados.md)** - Hooks de configuración de formularios
- **[09-flujos-completos.md](./09-flujos-completos.md)** - Flujos que incluyen formularios

---

## 📋 Introducción

La aplicación utiliza **React Hook Form 7.54.2** para la gestión de formularios. Aunque en los requisitos se menciona React Hook Form + Zod, **no se encontraron schemas de Zod** en el código. Las validaciones se realizan directamente con las reglas de React Hook Form.

**Ubicación de formularios**:

- Formularios genéricos: `/src/components/Admin/Entity/EntityClient/EntityForms/`
- Formularios específicos: `/src/components/Admin/OrdersManager/`, `/src/components/Admin/Settings/`

---

## 🏗️ Arquitectura de Formularios

### Tipos de Formularios

1. **Formularios Genéricos** (Entity Forms)
   - `CreateEntityForm` - Creación genérica de entidades
   - `EditEntityForm` - Edición genérica de entidades
   - Configuración desde `entitiesConfig.js`

2. **Formularios Específicos**
   - `CreateOrderForm` - Crear pedidos
   - `OrderEditSheet` - Editar pedidos
   - `SettingsForm` - Configuraciones (NO usa React Hook Form)

3. **Configuración de Formularios**
   - `useOrderCreateFormConfig` - Configuración para crear pedidos
   - `useOrderFormConfig` - Configuración para editar pedidos

---

## 📦 React Hook Form - Configuración Base

### Setup Básico

```javascript
import { useForm, Controller, useFieldArray } from 'react-hook-form';

const {
  register, // Para inputs no controlados
  handleSubmit, // Manejar submit
  control, // Para Controller (componentes controlados)
  reset, // Resetear formulario
  watch, // Observar valores
  setValue, // Establecer valores programáticamente
  formState: {
    errors, // Errores de validación
    isSubmitting, // Estado de envío
  },
} = useForm({
  defaultValues: {}, // Valores por defecto
  mode: 'onChange', // Modo de validación
});
```

### Modo de Validación

Todos los formularios usan `mode: 'onChange'`, lo que significa:

- Validación en tiempo real mientras el usuario escribe
- Feedback inmediato de errores

---

## 🎨 Componentes de Input Personalizados

### 1. Input (No Controlado)

**Uso con `register`**:

```javascript
<Input
  {...register('fieldName', {
    required: 'Campo obligatorio',
    minLength: { value: 3, message: 'Mínimo 3 caracteres' },
  })}
/>
```

### 2. DatePicker (Controlado)

**Uso con `Controller`**:

```javascript
<Controller
  name="entryDate"
  control={control}
  rules={{ required: 'La fecha es obligatoria' }}
  render={({ field: { onChange, value, onBlur } }) => (
    <DatePicker date={value} onChange={onChange} onBlur={onBlur} formatStyle="short" />
  )}
/>
```

**Características**:

- Recibe y retorna objetos `Date`
- Se formatea a string `YYYY-MM-DD` antes de enviar

### 3. Select (Controlado)

**Uso con `Controller`**:

```javascript
<Controller
  name="salesperson"
  control={control}
  rules={{ required: 'Seleccione un comercial' }}
  render={({ field: { onChange, value, onBlur } }) => (
    <Select value={value} onValueChange={onChange} onBlur={onBlur}>
      <SelectTrigger>
        <SelectValue placeholder="Seleccionar..." />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )}
/>
```

### 4. Combobox (Controlado)

**Uso con `Controller`**:

```javascript
<Controller
  name="customer"
  control={control}
  rules={{ required: 'El cliente es obligatorio' }}
  render={({ field: { onChange, value, onBlur } }) => (
    <Combobox
      options={customerOptions}
      value={value}
      onChange={onChange}
      placeholder="Seleccionar cliente"
      searchPlaceholder="Buscar cliente..."
      notFoundMessage="No se encontraron clientes"
    />
  )}
/>
```

### 5. EmailListInput (Controlado)

**Uso con `Controller`**:

```javascript
<Controller
  name="emails"
  control={control}
  defaultValue={[]}
  rules={field.rules}
  render={({ field: { value, onChange } }) => (
    <EmailListInput
      value={Array.isArray(value) ? value : []}
      onChange={onChange}
      placeholder="Añadir emails..."
    />
  )}
/>
```

**Características**:

- Maneja arrays de strings (emails)
- Validación de email integrada
- Prevención de duplicados

### 6. Textarea (No Controlado)

**Uso con `register`**:

```javascript
<Textarea
  {...register('notes', {
    maxLength: { value: 500, message: 'Máximo 500 caracteres' },
  })}
  rows={4}
/>
```

---

## 📝 Formularios Genéricos (Entity Forms)

### CreateEntityForm

**Archivo**: `/src/components/Admin/Entity/EntityClient/EntityForms/CreateEntityForm/index.js`

**Props**:

```javascript
<CreateEntityForm config={entityConfig} onSuccess={handleSuccess} onCancel={handleCancel} />
```

**Configuración** (desde `entitiesConfig.js`):

```javascript
createForm: {
  title: "Nuevo Usuario",
  endpoint: "users",
  method: "POST",
  successMessage: "Usuario creado con éxito",
  errorMessage: "Error al crear el usuario",
  fields: [
    {
      name: "name",
      label: "Nombre",
      type: "text",
      validation: {
        required: "El nombre es obligatorio",
        minLength: {
          value: 3,
          message: "El nombre debe tener al menos 3 caracteres"
        }
      },
      cols: { sm: 3, md: 3, lg: 3, xl: 3 }
    }
  ]
}
```

**Tipos de campos soportados**:

- `text` - Input de texto
- `date` - DatePicker
- `select` - Select con opciones
- `Autocomplete` - Combobox con carga dinámica desde endpoint
- `textarea` - Textarea
- `emailList` - EmailListInput

**Funcionalidad**:

1. **Carga dinámica de opciones**: Los campos `Autocomplete` cargan opciones desde endpoints API v2
2. **Validación de patrones**: Convierte strings de regex a RegExp
3. **Grid responsive**: Sistema de columnas (sm, md, lg, xl)
4. **Envío**: Llama a `createEntity` service con datos del formulario

**Ejemplo de uso**:

```javascript
import CreateEntityForm from '@/components/Admin/Entity/EntityClient/EntityForms/CreateEntityForm';
import { configs } from '@/configs/entitiesConfig';

function CreateUserPage() {
  const config = configs['users'];

  return (
    <CreateEntityForm
      config={config}
      onSuccess={() => router.push('/admin/users')}
      onCancel={() => router.back()}
    />
  );
}
```

### EditEntityForm

**Archivo**: `/src/components/Admin/Entity/EntityClient/EntityForms/EditEntityForm/index.js`

**Props**:

```javascript
<EditEntityForm
  config={entityConfig}
  id={entityId}
  onSuccess={handleSuccess}
  onCancel={handleCancel}
/>
```

**Funcionalidad**:

1. **Carga de datos**: Carga entidad existente desde API v2
2. **Mapeo de datos**: Usa `mapApiDataToFormValues` para mapear datos de API a valores de formulario
3. **Paths anidados**: Soporta paths como `company.address.street` usando `lodash.get`
4. **Conversión de fechas**: Convierte strings de fecha a objetos Date
5. **Envío**: Llama a `submitEntityForm` service

**Función de mapeo**:

```javascript
export function mapApiDataToFormValues(fields, data) {
  const result = {};
  for (const field of fields) {
    if (field.path) {
      result[field.name] = get(data, field.path, null);
    } else {
      result[field.name] = data[field.name];
    }
    // Convertir fechas
    if (field.type === 'date' && result[field.name]) {
      result[field.name] = new Date(result[field.name]);
    }
  }
  return result;
}
```

---

## 📋 Formularios Específicos

### CreateOrderForm

**Archivo**: `/src/components/Admin/OrdersManager/CreateOrderForm/index.js`

**Características**:

- Usa `useOrderCreateFormConfig` para configuración
- Carga datos del cliente automáticamente cuando se selecciona
- Usa `useFieldArray` para productos planificados (array dinámico)
- Formatea fechas a `YYYY-MM-DD` antes de enviar

**Estructura**:

```javascript
const { defaultValues, formGroups, loading } = useOrderCreateFormConfig();

const { register, handleSubmit, control, watch, setValue } = useForm({
  defaultValues: {
    ...defaultValues,
    plannedProducts: [], // Array dinámico
  },
  mode: 'onChange',
});

// Cargar datos del cliente cuando cambia
useEffect(() => {
  const customerId = watch('customer');
  if (!customerId) return;

  getCustomer(customerId, token).then((customer) => {
    setValue('salesperson', customer.salesperson?.id);
    setValue('payment', customer.paymentTerm?.id);
    // ... más campos
  });
}, [watch('customer')]);

// Array dinámico de productos
const { fields, append, remove } = useFieldArray({
  control,
  name: 'plannedProducts',
});
```

**Envío**:

```javascript
const handleCreate = async (formData) => {
  const payload = {
    customer: parseInt(formData.customer),
    entryDate: format(formData.entryDate, 'yyyy-MM-dd'),
    loadDate: format(formData.loadDate, 'yyyy-MM-dd'),
    plannedProducts: formData.plannedProducts.map((line) => ({
      product: parseInt(line.product),
      quantity: parseFloat(line.quantity),
      boxes: parseInt(line.boxes),
      unitPrice: parseFloat(line.unitPrice),
      tax: parseInt(line.tax),
    })),
  };

  const newOrder = await createOrder(payload);
  onCreate(newOrder.id);
};
```

### OrderEditSheet

**Archivo**: `/src/components/Admin/OrdersManager/Order/OrderEditSheet/index.js`

**Características**:

- Usa `useOrderFormConfig` para configuración
- Se abre en un Sheet (panel lateral)
- Carga datos del pedido desde `OrderContext`
- No incluye campo de cliente (no se puede cambiar)

**Uso**:

```javascript
import { useOrderContext } from '@/context/OrderContext';

function OrderEditSheet() {
  const { order, updateOrderData } = useOrderContext();
  const { formGroups, defaultValues } = useOrderFormConfig({ orderData: order });

  const { register, handleSubmit, reset, control } = useForm({
    defaultValues,
    mode: 'onChange',
  });

  // Resetear cuando cambian los valores por defecto
  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues]);

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      entryDate: format(data.entryDate, 'yyyy-MM-dd'),
      loadDate: format(data.loadDate, 'yyyy-MM-dd'),
    };
    await updateOrderData(payload);
  };

  return (
    <Sheet>
      <SheetTrigger>Editar</SheetTrigger>
      <SheetContent>
        <form onSubmit={handleSubmit(onSubmit)}>{/* Renderizar formGroups */}</form>
      </SheetContent>
    </Sheet>
  );
}
```

### SettingsForm

**Archivo**: `/src/components/Admin/Settings/SettingsForm.js`

**⚠️ IMPORTANTE**: Este formulario **NO usa React Hook Form**. Usa `useState` directamente.

**Características**:

- Formulario simple con `useState`
- Campos anidados (ej: `company.name`, `company.address.street`)
- Actualiza `SettingsContext` al guardar

**Estructura**:

```javascript
const [values, setValues] = useState({});

const handleChange = (e) => {
  setValues((prev) => ({
    ...prev,
    [e.target.name]: e.target.value,
  }));
};

const handleSubmit = async (e) => {
  e.preventDefault();
  await updateSettings(values);
  setSettings(values); // Actualizar contexto
};
```

**Razón**: Probablemente por simplicidad, ya que no requiere validaciones complejas.

---

## 🔧 Configuración de Formularios

### useOrderCreateFormConfig

**Archivo**: `/src/hooks/useOrderCreateFormConfig.js`

**Retorna**:

```javascript
{
  defaultValues: Object,      // Valores por defecto
  formGroups: Array,          // Grupos de campos
  loading: boolean,           // Si está cargando opciones
  handleGetCustomer: Function // Función para obtener cliente
}
```

**Estructura de formGroups**:

```javascript
[
  {
    group: 'Cliente',
    grid: 'grid-cols-1 gap-4',
    fields: [
      {
        name: 'customer',
        label: 'Cliente',
        component: 'Combobox',
        rules: { required: 'El cliente es obligatorio' },
        options: [], // Se llena dinámicamente
        props: {
          placeholder: 'Seleccionar cliente',
          searchPlaceholder: 'Buscar cliente...',
          notFoundMessage: 'No se encontraron clientes',
        },
      },
    ],
  },
  // ... más grupos
];
```

**Componentes soportados**:

- `Input`
- `Select`
- `Combobox`
- `DatePicker`
- `Textarea`
- `EmailListInput`

### useOrderFormConfig

**Archivo**: `/src/hooks/useOrderFormConfig.js`

Similar a `useOrderCreateFormConfig` pero:

- Sin campo de cliente (no se puede cambiar)
- Valores iniciales desde datos del pedido
- Campos adaptados para edición

---

## ✅ Validaciones

### Reglas de Validación

Las validaciones se definen en la configuración de campos:

```javascript
{
  name: 'email',
  rules: {
    required: 'El email es obligatorio',
    pattern: {
      value: /^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/,
      message: 'Formato de email no válido'
    }
  }
}
```

### Tipos de Validación Soportados

1. **required**: Campo obligatorio

   ```javascript
   rules: {
     required: 'Mensaje de error';
   }
   ```

2. **minLength / maxLength**: Longitud mínima/máxima

   ```javascript
   rules: {
     minLength: { value: 3, message: 'Mínimo 3 caracteres' },
     maxLength: { value: 50, message: 'Máximo 50 caracteres' }
   }
   ```

3. **pattern**: Expresión regular

   ```javascript
   rules: {
     pattern: {
       value: /^[0-9]+$/,
       message: 'Solo números'
     }
   }
   ```

4. **min / max**: Valores numéricos

   ```javascript
   rules: {
     min: { value: 0.01, message: 'Debe ser mayor que 0' },
     max: { value: 1000, message: 'Máximo 1000' }
   }
   ```

5. **valueAsNumber**: Convertir a número
   ```javascript
   register('quantity', {
     valueAsNumber: true,
     min: { value: 0.01, message: 'Debe ser mayor que 0' },
   });
   ```

### Validación de Patrones en Entity Forms

Los formularios genéricos convierten strings de regex a RegExp:

```javascript
function prepareValidations(fields) {
  return fields.map((field) => {
    if (field.validation?.pattern?.value && typeof field.validation.pattern.value === 'string') {
      const raw = field.validation.pattern.value;
      // Remover / al inicio y final
      const regexBody = raw.replace(/^\/|\/$/g, '');
      field.validation.pattern.value = new RegExp(regexBody);
    }
    return field;
  });
}
```

### Validación y mensajes de error (inline + backend 422)

En el proyecto se usa un **mismo criterio** en todos los formularios que envían datos al API (OrderEditSheet, CreateOrderForm, CreateEntityForm, EditEntityForm):

1. **Errores inline**: cada campo muestra su error debajo del input (`errors[fieldName].message`).
2. **Toast al enviar**: si la validación falla (cliente o servidor), se muestra un toast con un mensaje resumen (p. ej. "Por favor, corrige los errores en el formulario" o el `userMessage` del 422).
3. **Botón de envío siempre pulsable** (salvo mientras se envía): el botón no se deshabilita por tener errores de validación, para que el usuario pueda pulsar "Guardar" / "Crear" y ver los mensajes inline y el toast.

**Validación en cliente (React Hook Form)**  
Las reglas (`rules` / `validation`) se ejecutan al hacer submit. Si fallan, `handleSubmit` llama al segundo callback con `formErrors` y los errores quedan en `formState.errors`, por lo que se muestran inline y se puede mostrar un toast.

**Validación en servidor (HTTP 422)**  
Cuando el backend devuelve **422 Unprocessable Entity** con un cuerpo de errores por campo, ese objeto se mapea al estado de React Hook Form para mostrarlo **inline** en los mismos campos.

- **Formato del backend** (contrato con el API):
  - Cuerpo: `{ message, userMessage, errors }`.
  - `errors` es un objeto: clave = nombre del campo en **camelCase**, valor = array de mensajes.
  - Arrays: notación de punto con índice, p. ej. `plannedProducts.0.product`, `emails.0`.

- **Helper en el frontend**: `setErrorsFrom422(setError, errors)`
  - Ubicación: `/src/lib/validation/setErrorsFrom422.js`.
  - Recorre `errors` y llama a `setError(key, { type: 'server', message: messages[0] })` para cada clave.

**Uso en formularios**  
En el `catch` del submit:

- Si el error es **ApiError** (pedidos) con `status === 422` y `error.data.errors`, se llama a `setErrorsFrom422(setError, error.data.errors)` y se muestra un toast con `error.data.userMessage` (o equivalente).
- Si el error es la **Response** (formularios genéricos) con `status === 422`, se hace `await response.json()`, se llama a `setErrorsFrom422(setError, data.errors)` y se muestra un toast con `data.userMessage`.

Los servicios de pedidos (`orderService.createOrder`, `orderService.updateOrder`) en 422 lanzan `ApiError(message, status, errorData)` para que los componentes puedan leer `error.data.errors`. Los servicios genéricos de entidades lanzan la `Response` cuando `!response.ok`, y el formulario comprueba `err.status === 422` y parsea el cuerpo.

**Resumen**

- Errores **siempre inline** (debajo del campo), tanto los de validación cliente como los del 422.
- **Toast** en submit cuando hay errores (cliente o 422).
- **Botón** deshabilitado solo durante el envío (`isSubmitting` / `saving`), no por tener errores, para que el usuario pueda pulsar y ver validación y mensajes.

---

## 🔄 Arrays Dinámicos (useFieldArray)

### Uso en CreateOrderForm

```javascript
import { useFieldArray } from 'react-hook-form';

const { fields, append, remove } = useFieldArray({
  control,
  name: 'plannedProducts',
});

// Añadir producto
<Button onClick={() => append({ product: '', quantity: 0, boxes: 0 })}>Añadir Producto</Button>;

// Renderizar productos
{
  fields.map((field, index) => (
    <div key={field.id}>
      <Controller
        control={control}
        name={`plannedProducts.${index}.product`}
        rules={{ required: 'Producto es requerido' }}
        render={({ field }) => (
          <Combobox options={productOptions} value={field.value} onChange={field.onChange} />
        )}
      />
      <Input
        {...register(`plannedProducts.${index}.quantity`, {
          required: 'Cantidad es requerida',
          valueAsNumber: true,
          min: { value: 0.01, message: 'Debe ser mayor que 0' },
        })}
      />
      <Button onClick={() => remove(index)}>Eliminar</Button>
    </div>
  ));
}
```

---

## 🎯 Patrones de Renderizado

### Función renderField

Todos los formularios usan una función `renderField` que renderiza el componente apropiado según la configuración:

```javascript
const renderField = (field) => {
  const commonProps = {
    id: field.name,
    placeholder: field.props?.placeholder || '',
    ...register(field.name, field.rules),
  };

  switch (field.component) {
    case 'DatePicker':
      return (
        <Controller
          name={field.name}
          control={control}
          rules={field.rules}
          render={({ field: { onChange, value, onBlur } }) => (
            <DatePicker date={value} onChange={onChange} onBlur={onBlur} {...field.props} />
          )}
        />
      );
    case 'Select':
    // ... similar
    case 'Combobox':
    // ... similar
    case 'Textarea':
      return <Textarea {...commonProps} />;
    case 'emailList':
    // ... Controller con EmailListInput
    case 'Input':
    default:
      return <Input {...commonProps} />;
  }
};
```

### Renderizado de Grupos

```javascript
{
  formGroups.map((group) => (
    <div key={group.group}>
      <h3>{group.group}</h3>
      <Separator />
      <div className={`grid ${group.grid}`}>
        {group.fields.map((field) => (
          <div key={field.name}>
            <Label>{field.label}</Label>
            {renderField(field)}
            {errors[field.name] && (
              <p className="text-sm text-red-500">{errors[field.name].message}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  ));
}
```

---

## 📤 Manejo de Envío

### Patrón Estándar

```javascript
const onSubmit = async (formData) => {
  const toastId = toast.loading('Guardando...', getToastTheme());

  try {
    // Preparar payload
    const payload = {
      ...formData,
      entryDate: format(formData.entryDate, 'yyyy-MM-dd'),
      // ... transformaciones
    };

    // Enviar
    const result = await createEntity(payload);

    toast.success('Guardado correctamente', { id: toastId });
    onSuccess(result);
  } catch (error) {
    toast.error(error.message || 'Error al guardar', { id: toastId });
  }
};

<form onSubmit={handleSubmit(onSubmit)}>
  {/* campos */}
  <Button type="submit" disabled={isSubmitting}>
    Guardar
  </Button>
</form>;
```

### Transformaciones Comunes

1. **Fechas**: `Date` → `YYYY-MM-DD`

   ```javascript
   entryDate: format(formData.entryDate, 'yyyy-MM-dd');
   ```

2. **Números**: Strings → Numbers

   ```javascript
   quantity: parseFloat(formData.quantity),
   boxes: parseInt(formData.boxes)
   ```

3. **IDs**: Strings → Numbers
   ```javascript
   customer: parseInt(formData.customer);
   ```

---

## 🔄 Carga de Datos del Cliente (CreateOrderForm)

Cuando se selecciona un cliente, se cargan automáticamente sus datos:

```javascript
useEffect(() => {
  const selectedCustomerId = watch('customer');
  if (!selectedCustomerId) return;

  getCustomer(selectedCustomerId, token)
    .then((customer) => {
      setValue('salesperson', customer.salesperson?.id?.toString() || '');
      setValue('payment', customer.paymentTerm?.id?.toString() || '');
      setValue('incoterm', customer.incoterm?.id?.toString() || '');
      setValue('billingAddress', customer.billingAddress || '');
      setValue('shippingAddress', customer.shippingAddress || '');
      setValue('transport', customer.transport?.id?.toString() || '');
      setValue('emails', customer.emails || []);
      setValue('ccEmails', customer.ccEmails || []);
      // ... más campos
    })
    .catch((err) => {
      toast.error('Error al cargar la información del cliente');
    });
}, [watch('customer'), setValue, session]);
```

---

## 🎨 Estilos y Layout

### Grid System

Los formularios usan Tailwind Grid:

```javascript
{
  group: 'Información Comercial',
  grid: 'grid-cols-2 gap-4',  // 2 columnas en desktop
  fields: [
    {
      name: 'salesperson',
      colSpan: 'col-span-1',  // Ocupa 1 columna
    },
    {
      name: 'notes',
      colSpan: 'col-span-2',  // Ocupa 2 columnas (ancho completo)
    }
  ]
}
```

### Responsive en Entity Forms

```javascript
{
  cols: {
    sm: 6,   // 6 columnas en mobile
    md: 3,   // 3 columnas en tablet
    lg: 3,   // 3 columnas en desktop
    xl: 3    // 3 columnas en xl
  }
}
```

Renderizado:

```javascript
<div className={`sm:col-span-${field.cols.sm} md:col-span-${field.cols.md} lg:col-span-${field.cols.lg} xl:col-span-${field.cols.xl}`}>
```

---

## 📊 Estadísticas

- **Formularios con React Hook Form**: 4 principales
- **Formularios sin React Hook Form**: 1 (SettingsForm)
- **Componentes de input personalizados**: 6 (Input, Select, Combobox, DatePicker, Textarea, EmailListInput)
- **Hooks de configuración**: 2 (useOrderCreateFormConfig, useOrderFormConfig)

---

## ⚠️ Observaciones Críticas y Mejoras Recomendadas

### 1. Falta de Zod

- **Archivo**: Todo el proyecto
- **Problema**: Se menciona React Hook Form + Zod en requisitos, pero no se encontraron schemas de Zod
- **Impacto**: Validaciones menos robustas, no hay validación de tipos en tiempo de compilación
- **Recomendación**: Implementar schemas Zod o documentar claramente que no se usa

### 2. SettingsForm sin React Hook Form

- **Archivo**: `/src/components/Admin/Settings/SettingsForm.js`
- **Problema**: Único formulario que no usa React Hook Form, usa useState directamente
- **Impacto**: Inconsistencia, falta de validaciones integradas
- **Recomendación**: Migrar a React Hook Form para consistencia

### 3. Validación de Email Básica

- **Archivo**: Múltiples formularios
- **Problema**: Regex de email básica (`/^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/`) puede rechazar emails válidos
- **Impacto**: Usuarios con emails válidos pueden tener problemas
- **Recomendación**: Usar librería de validación de email o regex más completa

### 4. Conversión de Fechas Inconsistente

- **Archivo**: Múltiples formularios
- **Problema**: Algunos formularios formatean fechas manualmente, otros no
- **Impacto**: Posibles errores si se olvida formatear
- **Recomendación**: Crear helper común para formatear fechas antes de enviar

### 5. Falta de Validación de Tipos

- **Archivo**: Todos los formularios
- **Problema**: No hay validación de tipos (TypeScript o PropTypes)
- **Impacto**: Errores en tiempo de ejecución
- **Recomendación**: Añadir TypeScript o PropTypes

### 6. useFieldArray sin Validación de Array

- **Archivo**: `/src/components/Admin/OrdersManager/CreateOrderForm/index.js`
- **Línea**: 87-90
- **Problema**: No hay validación de que `plannedProducts` tenga al menos un elemento
- **Impacto**: Se puede crear pedido sin productos
- **Recomendación**: Añadir validación `minLength: 1` al array

### 7. Carga de Opciones sin Manejo de Errores

- **Archivo**: `CreateEntityForm`, `useOrderCreateFormConfig`
- **Problema**: Si falla la carga de opciones, el formulario se renderiza sin opciones
- **Impacto**: Usuario no puede seleccionar valores
- **Recomendación**: Mostrar error o estado de carga

### 8. Reset de Formulario Inconsistente

- **Archivo**: Múltiples formularios
- **Problema**: Algunos usan `reset()` después de éxito, otros no
- **Impacto**: Inconsistencia en UX
- **Recomendación**: Estandarizar comportamiento

### 9. Falta de Confirmación en Formularios Destructivos

- **Archivo**: No encontrado
- **Problema**: No se encontraron formularios de eliminación con confirmación
- **Impacto**: Posibles eliminaciones accidentales
- **Recomendación**: Añadir confirmación antes de eliminar

### 10. Validación de Patrones con Strings

- **Archivo**: `CreateEntityForm`, `EditEntityForm`
- **Línea**: 30-44, 49-57
- **Problema**: Conversión de strings de regex puede fallar con patrones complejos
- **Impacto**: Validaciones pueden no funcionar correctamente
- **Recomendación**: Validar que la conversión funcione o usar RegExp directamente

### 11. Falta de Debounce en Búsquedas

- **Archivo**: `CreateEntityForm` (Autocomplete)
- **Problema**: Carga opciones inmediatamente, sin debounce
- **Impacto**: Múltiples requests innecesarios
- **Recomendación**: Implementar debounce en búsquedas de autocomplete

### 12. EmailListInput sin Validación de Dominio

- **Archivo**: `/src/components/ui/emailListInput.jsx`
- **Problema**: Validación de email básica (mencionado en componentes UI)
- **Impacto**: Puede aceptar emails inválidos
- **Recomendación**: Mejorar validación de email
