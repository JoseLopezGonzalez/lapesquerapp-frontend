# Introducción - Documentación Frontend Brisapp Next.js

## 📋 Visión General

**Brisapp** es una aplicación web desarrollada con **Next.js 15** que actúa como panel de administración para la plataforma pesquera **BlueApp/PesquerApp**. La aplicación se conecta a una API Laravel backend y proporciona herramientas completas para la gestión diaria de operaciones pesqueras, incluyendo pedidos, producción, almacenes, clientes, productos, etiquetado y más.

### Propósito de esta Documentación

Esta documentación tiene como objetivo:

1. **Facilitar el entendimiento** del frontend para cualquier programador humano que necesite modificar o extender el código.
2. **Proporcionar contexto técnico fiable** para IAs que trabajen con este código.
3. **Documentar el estado real** del código, incluyendo fallos, elementos incompletos, errores conceptuales e inconsistencias presentes.

---

## ⚠️ IMPORTANTE: API v2 es la Versión Activa

**Toda la documentación se basa exclusivamente en la interacción con la API v2**, que es la versión activa del backend.

- **API v2** (`/api/v2/`): Versión activa y en uso. Todos los servicios documentados utilizan esta versión.
- **API v1** (`/api/v1/`): Versión obsoleta, solo existe como capa de compatibilidad. No se documentará su uso en el frontend.

**Archivo de configuración**: `/src/configs/config.js`
```javascript
export const API_URL_V2 = `${API_URL}v2/`;  // Versión activa
export const API_URL_V1 = `${API_URL}v1/`;  // Obsoleta
```

---

## 🛠️ Stack Tecnológico

### Framework y Librerías Principales

- **Next.js 15.3.2** - Framework React con App Router
- **React 19.0.0-rc** - Biblioteca UI (versión release candidate)
- **NextAuth 4.24.11** - Autenticación y gestión de sesiones
- **React Hook Form 7.54.2** - Gestión de formularios
- **Tailwind CSS 3.4.1** - Framework CSS utility-first
- **ShadCN UI** - Componentes UI basados en Radix UI
- **NextUI 2.6.10** - Biblioteca de componentes adicional

### Librerías de UI y Componentes

- **Radix UI** - Componentes primitivos accesibles:
  - `@radix-ui/react-dialog`
  - `@radix-ui/react-dropdown-menu`
  - `@radix-ui/react-select`
  - `@radix-ui/react-tabs`
  - `@radix-ui/react-popover`
  - Y otros componentes Radix UI

- **Lucide React 0.475.0** - Iconos (configurado como icon library principal en ShadCN)
- **Heroicons 2.2.0** - Iconos adicionales
- **React Icons 5.3.0** - Colección de iconos

### Utilidades y Helpers

- **date-fns 4.1.0** - Manipulación de fechas
- **@internationalized/date 3.6.0** - Internacionalización de fechas
- **react-day-picker 8.10.1** - Selector de fechas
- **class-variance-authority 0.7.1** - Variantes de clases
- **clsx 2.1.1** - Utilidad para clases condicionales
- **tailwind-merge 3.0.1** - Merge de clases Tailwind

### Visualización y Exportación

- **Recharts 2.15.4** - Gráficos y visualización de datos
- **xlsx 0.18.5** - Exportación a Excel
- **jsPDF 3.0.0** - Generación de PDFs
- **html2canvas 1.4.1** - Captura de elementos HTML
- **file-saver 2.0.5** - Descarga de archivos

### Impresión y Códigos

- **react-barcode 1.6.1** - Generación de códigos de barras
- **react-qr-code 2.0.16** - Generación de códigos QR

### Otros

- **react-hot-toast 2.5.1** - Notificaciones toast
- **framer-motion 11.18.2** - Animaciones
- **@tanstack/react-table 8.21.3** - Tablas avanzadas
- **cmdk 1.0.0** - Command menu
- **lottie-web 5.12.2** - Animaciones Lottie
- **react-zoom-pan-pinch 3.7.0** - Zoom y pan en imágenes

---

## 📁 Estructura de Carpetas del Proyecto

```
brisapp-nextjs/
├── src/
│   ├── app/                    # Next.js App Router (rutas y páginas)
│   │   ├── admin/              # Rutas de administración
│   │   ├── warehouse/          # Rutas de operador de almacén
│   │   ├── home/               # Página de inicio
│   │   ├── api/                # API routes de Next.js
│   │   ├── layout.js           # Layout raíz
│   │   ├── page.js             # Página principal (login)
│   │   └── globals.css         # Estilos globales
│   ├── components/             # Componentes React
│   │   ├── Admin/              # Componentes del módulo Admin
│   │   ├── ui/                 # Componentes UI base (ShadCN)
│   │   ├── Shadcn/             # Componentes ShadCN personalizados
│   │   ├── Utilities/          # Componentes de utilidad
│   │   ├── AdminRouteProtection/  # Protección de rutas admin
│   │   ├── ProtectedRoute/     # Protección genérica de rutas
│   │   ├── WarehouseOperatorLayout/  # Layout para operadores
│   │   ├── LoginPage/          # Componentes de login
│   │   └── LandingPage/        # Componentes de landing
│   ├── context/                # Context API de React
│   │   ├── OrderContext.js     # Context para pedidos
│   │   ├── StoreContext.js     # Context para almacenes
│   │   └── SettingsContext.js  # Context para configuraciones
│   ├── hooks/                  # Hooks personalizados
│   │   ├── useOrder.js         # Hook para gestión de pedidos
│   │   ├── useStore.js         # Hook para almacenes
│   │   ├── useStores.js        # Hook para lista de almacenes
│   │   ├── usePallet.js        # Hook para pallets
│   │   ├── useLabel.js         # Hook para etiquetas
│   │   └── ...                 # Otros hooks
│   ├── services/               # Servicios API v2
│   │   ├── orderService.js     # Servicios de pedidos
│   │   ├── productionService.js # Servicios de producción
│   │   ├── storeService.js     # Servicios de almacenes
│   │   ├── customerService.js  # Servicios de clientes
│   │   └── ...                 # Otros servicios
│   ├── lib/                    # Utilidades y helpers
│   │   ├── utils.js            # Utilidades generales
│   │   └── fetchWithTenant.js  # Fetch con soporte multi-tenant
│   ├── configs/                # Configuraciones
│   │   ├── config.js           # Configuración general (API URLs, etc.)
│   │   ├── roleConfig.js       # Configuración de roles
│   │   └── navgationConfig.js  # Configuración de navegación
│   ├── customs/                # Personalizaciones
│   ├── data/                   # Datos estáticos
│   ├── helpers/                # Funciones auxiliares
│   └── middleware.js           # Middleware de Next.js
├── public/                     # Archivos estáticos
├── docs/                       # Documentación
├── package.json                # Dependencias del proyecto
├── next.config.mjs             # Configuración de Next.js
├── tailwind.config.js          # Configuración de Tailwind
└── components.json             # Configuración de ShadCN UI
```

---

## 🎯 Módulos Principales de la Aplicación

Basado en la configuración de navegación (`/src/configs/navgationConfig.js`) y la estructura de rutas, los módulos principales son:

### 1. **Dashboard/Inicio** (`/admin/home`)
- Panel principal con estadísticas y resumen

### 2. **Almacenes** (`/admin/stores`)
- Gestión de almacenes
- Visualización de posiciones
- Gestión de pallets y cajas
- Stock por almacén

### 3. **Pedidos** (`/admin/orders`)
- Creación y edición de pedidos
- Gestión de productos planificados
- Seguimiento de estado
- Incidencias

### 4. **Producciones** (`/admin/productions`) ⚠️ **EN CONSTRUCCIÓN**
- Gestión de producciones
- Registros de producción
- Inputs y outputs
- Consumos de producción
- **Estado**: Módulo en desarrollo activo, funcionalidades parciales

### 5. **Productos** (`/admin/products`)
- Gestión de productos
- Categorías y familias de productos

### 6. **Clientes** (`/admin/customers`)
- CRUD de clientes
- Información comercial

### 7. **Proveedores** (`/admin/suppliers`)
- Gestión de proveedores

### 8. **Etiquetas** (`/admin/label-editor`)
- Editor de etiquetas
- Generación de códigos de barras/QR
- Impresión de etiquetas

### 9. **Pallets** (`/admin/pallets`)
- Gestión de pallets
- Asignación a posiciones
- Movimiento entre almacenes

### 10. **Recepciones de Materia Prima** (`/admin/raw-material-receptions`)
- Registro de recepciones
- Gráficos y estadísticas

### 11. **Salidas de Cebo** (`/admin/cebo-dispatches`)
- Gestión de salidas
- Gráficos y estadísticas

### 12. **Configuraciones** (`/admin/settings`)
- Configuraciones globales del sistema

### 13. **Operador de Almacén** (`/warehouse/[storeId]`)
- Interfaz específica para operadores de almacén
- Visualización y gestión de un almacén específico

---

## 🔐 Autenticación y Autorización

- **NextAuth 4.24.11** para gestión de sesiones
- **Middleware** (`/src/middleware.js`) para protección de rutas basada en roles
- **Roles principales**: `admin`, `manager`, `superuser`, `store_operator`
- Validación de tokens con el backend API v2
- Redirección automática según roles

---

## 🎨 Sistema de Diseño

### Tailwind CSS
- Configuración en `/tailwind.config.js`
- Design tokens basados en variables CSS (HSL)
- Breakpoints personalizados: `sm-md`, `md-lg`, `lg-xl`, `xl-2xl`, `2xl-3xl`, `3xl`
- Plugins: `tailwindcss-animate`, `@tailwindcss/forms`

### ShadCN UI
- Estilo: `new-york`
- Base color: `neutral`
- CSS variables habilitadas
- Icon library: `lucide`
- Componentes en `/src/components/ui/`

### NextUI
- Integrado en Tailwind config
- Soporte para dark mode

---

## 📝 Convenciones de Código

### Componentes
- **Client Components**: La mayoría de componentes usan `"use client"` debido a interactividad
- **Server Components**: Se usan cuando es posible (páginas estáticas, layouts)
- Nomenclatura: PascalCase para componentes

### Archivos
- Extensiones: `.js`, `.jsx` (no TypeScript)
- Estructura: Un componente por archivo generalmente

### Imports
- Path aliases configurados en `jsconfig.json`:
  - `@/components` → `/src/components`
  - `@/lib` → `/src/lib`
  - `@/hooks` → `/src/hooks`
  - `@/services` → `/src/services`
  - `@/configs` → `/src/configs`

### Estado Global
- **Context API** para estado compartido (no Zustand)
- Contextos principales: `OrderContext`, `StoreContext`, `SettingsContext`
- Hooks personalizados para lógica de negocio

---

## 🔄 Flujo de Datos

1. **Componente** → Llama a **Hook personalizado** o **Context**
2. **Hook/Context** → Llama a **Servicio API v2**
3. **Servicio** → Hace fetch a **API v2** usando `fetchWithTenant`
4. **API v2** → Retorna datos
5. **Servicio** → Procesa y retorna datos
6. **Hook/Context** → Actualiza estado
7. **Componente** → Se re-renderiza con nuevos datos

---

## 📦 Gestión de Estado

### Context API
- `OrderContext` - Estado de pedidos activos
- `StoreContext` - Estado de almacenes
- `SettingsContext` - Configuraciones globales

### Hooks Personalizados
- Encapsulan lógica de negocio
- Gestionan estado local con `useState`
- Manejan efectos con `useEffect`
- Ejemplos: `useOrder`, `useStore`, `usePallet`

### Estado Local
- `useState` para estado de componente
- `useReducer` (si se usa) para estado complejo

---

## 🌐 Configuración de API

### Endpoints
- **Producción**: `https://api.lapesquerapp.es/api/`
- **Desarrollo**: `http://127.0.0.1:8000/api/` (comentado en config)

### Multi-tenant
- Función `fetchWithTenant` en `/src/lib/fetchWithTenant.js`
- Maneja headers de tenant automáticamente

---

## 🚀 Scripts Disponibles

```bash
npm run dev      # Desarrollo (localhost:3000)
npm run build    # Build de producción
npm run start    # Iniciar servidor de producción
npm run lint     # Linter
```

---

## 📚 Próximos Pasos

Esta documentación se genera por partes. El siguiente archivo será:
- **01-ARQUITECTURA.md** - Arquitectura detallada de Next.js App Router, layouts, y organización de módulos

---

## Observaciones Críticas y Mejoras Recomendadas

### 1. React 19 Release Candidate
- **Archivo**: `package.json`
- **Línea**: 46-47
- **Problema**: Se está usando React 19 RC (`19.0.0-rc-66855b96-20241106`), que es una versión inestable
- **Impacto**: Posibles breaking changes cuando se actualice a la versión estable
- **Recomendación**: Monitorear actualizaciones y planificar migración a versión estable

### 2. Falta de TypeScript
- **Archivo**: Todo el proyecto
- **Problema**: El proyecto usa JavaScript puro, no TypeScript
- **Impacto**: Menor seguridad de tipos, más errores en tiempo de ejecución
- **Recomendación**: Considerar migración gradual a TypeScript para mejor mantenibilidad

### 3. Configuración de Next.js Vacía
- **Archivo**: `next.config.mjs`
- **Línea**: 1-4
- **Problema**: Configuración completamente vacía, sin optimizaciones ni configuraciones específicas
- **Impacto**: Posibles problemas de rendimiento o funcionalidad no optimizada
- **Recomendación**: Revisar si se necesitan configuraciones específicas (imágenes, redirects, headers, etc.)

### 4. Mezcla de Librerías de Iconos
- **Archivo**: Múltiples componentes
- **Problema**: Se usan tres librerías de iconos diferentes: Lucide, Heroicons, React Icons
- **Impacto**: Bundle size aumentado, inconsistencia visual potencial
- **Recomendación**: Estandarizar en una sola librería (preferiblemente Lucide, que es la configurada en ShadCN)

### 5. Falta de Validación con Zod
- **Archivo**: Formularios en general
- **Problema**: Aunque se menciona React Hook Form + Zod en los requisitos, no se encontraron schemas de Zod en el proyecto
- **Impacto**: Validación de formularios puede ser inconsistente
- **Recomendación**: Implementar schemas Zod para validación de formularios o documentar el sistema de validación actual

### 6. Context API en lugar de Zustand
- **Archivo**: `/src/context/`
- **Problema**: Se menciona Zustand/Context en los requisitos, pero solo se usa Context API
- **Impacto**: Ninguno crítico, pero puede haber confusión
- **Recomendación**: Documentar claramente que se usa Context API, no Zustand, o considerar migración si se necesita mejor rendimiento

### 7. Archivo de Hook Duplicado
- **Archivo**: `/src/hooks/usePrintElement copy.js`
- **Problema**: Existe un archivo con "copy" en el nombre, probablemente duplicado accidental
- **Impacto**: Confusión sobre cuál archivo usar
- **Recomendación**: Eliminar el archivo duplicado o renombrarlo si tiene propósito diferente

### 8. Módulo de Producción en Construcción
- **Archivo**: `/src/components/Admin/Productions/`
- **Problema**: Módulo marcado como "en construcción" pero tiene componentes grandes (ProductionOutputConsumptionsManager.jsx con 1241 líneas)
- **Impacto**: Código puede estar incompleto o tener funcionalidades parciales
- **Recomendación**: Documentar claramente qué funcionalidades están completas y cuáles pendientes

### 9. Falta de Documentación de Variables de Entorno
- **Archivo**: No existe `.env.example`
- **Problema**: No está claro qué variables de entorno se necesitan
- **Impacto**: Dificulta el setup del proyecto para nuevos desarrolladores
- **Recomendación**: Crear `.env.example` con todas las variables necesarias

### 10. Middleware Complejo
- **Archivo**: `/src/middleware.js`
- **Línea**: 1-125
- **Problema**: Middleware con mucha lógica, incluyendo validación de token con fetch al backend
- **Impacto**: Posible impacto en rendimiento, lógica compleja de mantener
- **Recomendación**: Considerar extraer lógica a funciones auxiliares o servicios separados

