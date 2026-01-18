# 03. Login Mobile

**Estado**: 📝 Planificación  
**Prioridad**: 3 (Después de Home/Dashboard)  
**Estimación**: Media complejidad

---

## 📋 Resumen

Este documento detalla el plan para optimizar la página de login para mobile, mejorando la experiencia de usuario, la accesibilidad y la usabilidad en dispositivos móviles.

**Objetivo**: Transformar el login de escritorio en una experiencia mobile limpia, intuitiva y optimizada para touch, manteniendo todas las funcionalidades actuales (validación de tenant, branding dinámico, modo demo).

---

## 🎯 Componente a Adaptar

### LoginPage (`/src/components/LoginPage/index.js`)
- **Formulario de login**: Email y contraseña
- **Panel de imagen de branding**: Imagen dinámica según subdominio
- **Validación de tenant**: Alertas y estados
- **Modo demo**: Auto-relleno de credenciales
- **Toggle de contraseña**: Mostrar/ocultar
- **RotatingText**: Texto animado "Mantén tu producción..."

---

## 🔍 Análisis del Estado Actual

### Estructura Actual

```jsx
<div className="login-background flex min-h-screen items-center justify-center">
  <div className="w-full max-w-[1000px] py-20 px-6">
    <Card className="relative flex sm:flex-row flex-col w-full h-full p-2">
      {/* Panel izquierdo: Imagen */}
      <div className="relative w-full max-w-[500px] ...">
        <Image src={brandingImageUrl} />
      </div>
      
      {/* Panel derecho: Formulario */}
      <div className="flex w-full flex-col items-center justify-center p-8 lg:p-12">
        <form className="mx-auto w-full max-w-xs space-y-8 py-5 sm:py-20">
          {/* Título, inputs, botón */}
        </form>
      </div>
    </Card>
  </div>
</div>
```

### Problemas Identificados

1. **Layout de dos columnas en mobile**:
   - En mobile se apila verticalmente (`flex-col`), pero la imagen ocupa mucho espacio vertical
   - El padding `py-20` en el contenedor externo puede ser excesivo en mobile
   - La imagen tiene `min-h-[240px]` que puede ser demasiado grande
   - **IMPORTANTE**: La imagen de branding debe mantenerse visible en mobile para diferenciar al tenant

2. **Espaciado**:
   - Padding del formulario: `py-5 sm:py-20` - demasiado espacio vertical en mobile
   - Padding del contenedor: `px-6` - puede necesitar ajuste
   - `space-y-8` en el formulario puede ser demasiado

3. **Inputs**:
   - Inputs sin restricciones de altura mínima para mobile
   - Tamaño de texto puede ser demasiado pequeño
   - El botón de mostrar/ocultar contraseña puede ser difícil de tocar

4. **Tipografía**:
   - Título: `text-2xl sm:text-3xl sm:text-[2.5rem]` - puede ser demasiado grande en mobile
   - Subtítulo: `text-md sm:text-xl` - puede necesitar ajuste
   - RotatingText: `text-xl` - puede ser demasiado grande

5. **Imagen de branding**:
   - En mobile ocupa espacio vertical valioso, pero debe mantenerse visible (importante para diferenciar tenant)
   - Necesita reducirse en altura para mobile pero manteniendo proporción
   - `min-h-[240px]` puede ser demasiado grande para mobile
   - Debe ser más compacta pero visible

6. **Card**:
   - Padding `p-2` puede ser demasiado pequeño
   - El card puede necesitar bordes redondeados más grandes en mobile

7. **Alert de tenant inactivo**:
   - No está optimizado para mobile
   - Puede necesitar mejor espaciado y tipografía

---

## 🎨 Diseño Propuesto

### Principios Mobile

1. **Layout Full-Width Vertical**: Todo en una columna en mobile
2. **Formulario Centrado**: Formulario centrado vertical y horizontalmente
3. **Imagen de Branding Visible**: Mantener imagen visible pero compacta en mobile (importante para diferenciar tenant)
4. **Espaciado Consistente**: Usar Design Tokens Mobile
5. **Touch Targets**: Mínimo 44x44px para todos los elementos interactivos
6. **Tipografía Legible**: Texto mínimo 16px para inputs, 14px mínimo para labels
7. **Feedback Visual**: Estados de carga y error claros

### Layout Mobile Login

```
┌─────────────────────────┐
│   ┌─────────────────┐   │
│   │  Imagen Branding│   │
│   │  (Compacta,     │   │
│   │   reducida)     │   │
│   └─────────────────┘   │
│                         │
│   ┌─────────────────┐   │
│   │  La PesquerApp  │   │
│   │  (texto más     │   │
│   │   pequeño)      │   │
│   └─────────────────┘   │
│                         │
│   [Input Email]         │
│   (Full width, h-12)    │
│                         │
│   [Input Password]      │
│   (Full width, h-12)    │
│                         │
│   [Botón Login]         │
│   (Full width, h-12)    │
│                         │
│   [Link Soporte]        │
│                         │
└─────────────────────────┘
```

### Desktop Layout (mantener actual)

```
┌─────────────────────────────────────┐
│  ┌──────────┐  ┌─────────────────┐  │
│  │  Imagen  │  │  La PesquerApp  │  │
│  │  Branding│  │                 │  │
│  │          │  │  [Input Email]  │  │
│  │          │  │  [Input Pwd]    │  │
│  │          │  │  [Botón Login]  │  │
│  └──────────┘  └─────────────────┘  │
└─────────────────────────────────────┘
```

---

## 📐 Cambios Necesarios

### 1. Estructura y Layout

**Cambios principales**:
- Mantener imagen de branding visible en mobile pero más compacta
- Reducir altura de imagen en mobile (`h-32 md:min-h-[240px]` o similar)
- Reducir padding vertical del contenedor en mobile (`py-8 md:py-20`)
- Ajustar padding del Card (`p-4 md:p-2`)
- Layout vertical en mobile: imagen arriba, formulario abajo

**Estructura propuesta**:
```jsx
<div className="login-background flex min-h-screen items-center justify-center">
  <div className="w-full max-w-[1000px] py-8 md:py-20 px-4 md:px-6">
    {/* Alert de tenant inactivo - solo si aplica */}
    
    <Card className="relative flex flex-col md:flex-row w-full p-4 md:p-2">
      {/* Panel imagen - visible pero compacta en mobile */}
      <div className="relative w-full md:max-w-[500px] h-40 md:h-auto md:min-h-[240px] overflow-hidden rounded-lg">
        <Image
          src={brandingImageUrl || "/images/landing.png"}
          alt="Imagen de branding"
          fill
          className="object-cover"
          priority
          onError={(e) => {
            e.currentTarget.src = "/images/landing.png";
          }}
        />
      </div>
      
      {/* Panel formulario - siempre visible */}
      <div className="flex w-full flex-col items-center justify-center p-4 md:p-8 lg:p-12">
        <form className="mx-auto w-full max-w-xs space-y-6 md:space-y-8 py-4 md:py-20">
          {/* Formulario */}
        </form>
      </div>
    </Card>
  </div>
</div>
```

### 2. Tipografía

**Cambios**:
- Título principal: `text-xl md:text-2xl lg:text-3xl xl:text-[2.5rem]`
- Subtítulo: `text-sm md:text-md lg:text-xl`
- RotatingText: `text-base md:text-xl`
- Labels: `text-sm md:text-base` (asegurar mínimo 14px)
- Texto de soporte: `text-xs md:text-sm`

**Código propuesto**:
```jsx
<h2 className="text-xl md:text-2xl lg:text-3xl xl:text-[2.5rem] font-bold ...">
  La PesquerApp
</h2>
<span className="text-sm md:text-md lg:text-xl text-primary">
  Mantén tu producción
</span>
```

### 3. Inputs

**Cambios**:
- Altura mínima: `h-12` (48px) en mobile para evitar zoom en iOS
- Tamaño de texto: `text-base` (16px) mínimo en mobile
- Padding: `px-4 py-3` para mejor touch target
- Espaciado entre inputs: `gap-4` en lugar de `gap-1.5`

**Código propuesto**:
```jsx
<div className="grid w-full max-w-sm items-center gap-2 md:gap-1.5">
  <Label htmlFor="email" className="text-sm md:text-base">Email</Label>
  <Input
    type="email"
    className="h-12 md:h-auto text-base md:text-sm"
    placeholder="ejemplo@lapesquerapp.es"
  />
</div>
```

### 4. Botón de Toggle Contraseña

**Cambios**:
- Tamaño del botón: `w-10 h-10` mínimo (touch target 44x44px)
- Icono: `w-5 h-5` para mejor visibilidad
- Padding: `p-2` para área de toque generosa

**Código propuesto**:
```jsx
<button
  type="button"
  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-primary focus:outline-none"
  onClick={() => setShowPassword((v) => !v)}
  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
>
  {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
</button>
```

### 5. Botón de Login

**Cambios**:
- Altura: `h-12` (48px) mínimo en mobile
- Tamaño de texto: `text-base` (16px) en mobile
- Ancho: `w-full` siempre

**Código propuesto**:
```jsx
<Button 
  className="w-full h-12 md:h-auto text-base md:text-sm" 
  type="submit"
  disabled={loading || !tenantActive}
>
  {loading ? "Entrando..." : "Login"}
</Button>
```

### 6. Imagen de Branding

**Cambios**:
- Mantener visible en mobile pero más compacta (importante para diferenciar tenant)
- Reducir altura en mobile: `h-40 md:h-auto md:min-h-[240px]` (160px en mobile)
- Ajustar aspect ratio para mobile (más ancha que alta)
- Mantener visible y destacada para identificación del tenant

**Código propuesto**:
```jsx
{/* Panel imagen: Visible en mobile pero compacta */}
<div className="relative w-full md:max-w-[500px] h-40 md:h-auto md:min-h-[240px] overflow-hidden rounded-lg">
  <Image
    src={brandingImageUrl || "/images/landing.png"}
    alt="Imagen de branding"
    fill
    className="object-cover"
    priority
    onError={(e) => {
      e.currentTarget.src = "/images/landing.png";
    }}
  />
</div>
```

### 7. Alert de Tenant Inactivo

**Cambios**:
- Padding responsive: `p-4 md:p-6`
- Tipografía: `text-sm md:text-base`
- Espaciado mejorado para mobile

**Código propuesto**:
```jsx
{!tenantActive && (
  <Alert variant="destructive" className="mb-4 md:mb-0">
    <AlertCircleIcon className="h-4 w-4 md:h-5 md:w-5" />
    <AlertTitle className="text-sm md:text-base">
      Cuentas deshabilitadas para esta empresa
    </AlertTitle>
    <AlertDescription className="text-xs md:text-sm">
      {/* Contenido */}
    </AlertDescription>
  </Alert>
)}
```

### 8. Background del Login

**Cambios**:
- Asegurar que el background se vea bien en mobile
- Verificar que no haya problemas de scroll
- Padding adecuado para evitar que el contenido toque los bordes

---

## 📋 Plan de Implementación

### Fase 1: Layout Base (Prioridad Alta)

**Objetivo**: Adaptar la estructura del layout para mobile

**Tareas**:
1. ✅ Reducir altura de imagen de branding en mobile (mantener visible pero compacta)
2. ✅ Ajustar padding del contenedor principal (`py-8 md:py-20`)
3. ✅ Ajustar padding del Card (`p-4 md:p-2`)
4. ✅ Reducir espaciado del formulario en mobile (`space-y-6 md:space-y-8`)
5. ✅ Ajustar padding del formulario (`py-4 md:py-20`)

**Archivos a modificar**:
- `src/components/LoginPage/index.js`

---

### Fase 2: Tipografía y Textos (Prioridad Alta)

**Objetivo**: Ajustar todos los textos para legibilidad en mobile

**Tareas**:
1. ✅ Ajustar título principal (h2) con tamaños responsive
2. ✅ Ajustar subtítulo y RotatingText
3. ✅ Ajustar labels de inputs
4. ✅ Ajustar texto de soporte

**Archivos a modificar**:
- `src/components/LoginPage/index.js`

---

### Fase 3: Inputs y Formulario (Prioridad Alta)

**Objetivo**: Optimizar inputs para mobile (touch targets, tamaño de texto)

**Tareas**:
1. ✅ Ajustar altura de inputs (`h-12` en mobile)
2. ✅ Ajustar tamaño de texto de inputs (`text-base` en mobile)
3. ✅ Mejorar botón de toggle contraseña (touch target 44x44px)
4. ✅ Ajustar espaciado entre inputs (`gap-2 md:gap-1.5`)
5. ✅ Ajustar labels (tamaño de texto)

**Archivos a modificar**:
- `src/components/LoginPage/index.js`

---

### Fase 4: Botones y Acciones (Prioridad Media)

**Objetivo**: Optimizar botones para mobile

**Tareas**:
1. ✅ Ajustar altura del botón de login (`h-12` en mobile)
2. ✅ Ajustar tamaño de texto del botón (`text-base` en mobile)
3. ✅ Verificar estados disabled y loading

**Archivos a modificar**:
- `src/components/LoginPage/index.js`

---

### Fase 5: Alertas y Estados (Prioridad Media)

**Objetivo**: Optimizar alertas para mobile

**Tareas**:
1. ✅ Ajustar Alert de tenant inactivo (padding, tipografía)
2. ✅ Ajustar badge de modo demo (si aplica)

**Archivos a modificar**:
- `src/components/LoginPage/index.js`

---

### Fase 6: Ajustes Finales y Testing (Prioridad Baja)

**Objetivo**: Pulir detalles y probar en dispositivos reales

**Tareas**:
1. ✅ Verificar en diferentes tamaños de pantalla (320px, 375px, 414px)
2. ✅ Verificar en iOS y Android
3. ✅ Probar teclado virtual (inputs no deben quedar tapados)
4. ✅ Verificar modo demo
5. ✅ Verificar validación de tenant
6. ✅ Verificar toggle de contraseña
7. ✅ Verificar redirección después de login

**Testing en dispositivos**:
- iPhone SE (320px)
- iPhone 14/15 (390px)
- iPhone 14 Pro Max (430px)
- Android estándar (360px-412px)

---

## 🎨 Design Tokens Mobile Aplicados

### Espaciado
- Contenedor principal: `px-4 md:px-6` (16px mobile)
- Card padding: `p-4 md:p-2` (16px mobile)
- Formulario spacing: `space-y-6 md:space-y-8` (24px mobile)
- Gap entre inputs: `gap-2 md:gap-1.5` (8px mobile)

### Touch Targets
- Inputs: `h-12` (48px) - cumple con mínimo 44x44px
- Botón login: `h-12` (48px)
- Botón toggle contraseña: `w-10 h-10` (40px, pero con padding adicional)

### Tipografía
- Título: `text-xl md:text-2xl lg:text-3xl` (20px mobile, escalable)
- Subtítulo: `text-sm md:text-md lg:text-xl` (14px mobile)
- Labels: `text-sm md:text-base` (14px mobile)
- Inputs: `text-base` (16px mobile) - evita zoom en iOS
- Botón: `text-base md:text-sm` (16px mobile)

---

## ✅ Checklist de Implementación

### Layout
- [ ] Reducir altura de imagen de branding en mobile (mantener visible)
- [ ] Ajustar padding del contenedor principal
- [ ] Ajustar padding del Card
- [ ] Reducir espaciado del formulario

### Tipografía
- [ ] Ajustar título principal
- [ ] Ajustar subtítulo y RotatingText
- [ ] Ajustar labels
- [ ] Ajustar texto de soporte

### Inputs
- [ ] Altura mínima 48px en mobile
- [ ] Tamaño de texto 16px en mobile
- [ ] Mejorar botón toggle contraseña
- [ ] Ajustar espaciado entre inputs

### Botones
- [ ] Altura mínima 48px en mobile
- [ ] Tamaño de texto 16px en mobile

### Alertas
- [ ] Ajustar Alert de tenant inactivo
- [ ] Ajustar badge de modo demo

### Testing
- [ ] Verificar en iPhone SE (320px)
- [ ] Verificar en iPhone 14/15 (390px)
- [ ] Verificar en iPhone Pro Max (430px)
- [ ] Verificar en Android estándar
- [ ] Probar teclado virtual
- [ ] Verificar modo demo
- [ ] Verificar validación de tenant
- [ ] Verificar toggle de contraseña

---

## 📝 Notas Técnicas

### Teclado Virtual

**Problema potencial**: En mobile, cuando aparece el teclado virtual, puede tapar los inputs o botones.

**Solución**: El layout actual con `min-h-screen` y `flex items-center justify-center` debería manejar esto automáticamente, pero puede necesitar ajustes si hay problemas.

**Verificación necesaria**:
- Probar en iOS (Safari)
- Probar en Android (Chrome)
- Verificar que el formulario sea scrollable si es necesario

### RotatingText

**Consideración**: El componente `RotatingText` usa Framer Motion y puede tener animaciones complejas. En mobile, asegurarse de que:
- No cause problemas de rendimiento
- Se vea bien con tamaños de texto más pequeños
- Respete `prefers-reduced-motion`

### Background del Login

**Nota**: El componente usa `login-background` que tiene un background image. Verificar que:
- Se vea bien en mobile
- No cause problemas de scroll
- No sea demasiado pesado para conexiones móviles

---

## 🚀 Próximos Pasos

1. **Revisar este plan** y ajustar si es necesario
2. **Comenzar con Fase 1**: Layout base
3. **Continuar con Fase 2-6**: Implementación completa
4. **Testing exhaustivo** en dispositivos reales
5. **Ajustes finales** según feedback

---

**Última actualización**: Creación del plan

