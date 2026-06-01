# BrisApp – Panel de Administración

BrisApp es la interfaz web desarrollada en **Next.js 15** para gestionar la plataforma pesquera BlueApp/PesquerApp. Actúa como cliente para la API Laravel y proporciona todas las herramientas necesarias para la administración diaria de operaciones pesqueras.

---

## ✨ Características Principales

- **Next.js 15** con App Router y componentes de servidor/cliente
- **Autenticación** mediante [NextAuth](https://next-auth.js.org/) conectada a la API
- **Panel de administración** con múltiples módulos (almacenes, pedidos, productos, clientes, transportes…)
- **Gestor de pedidos** y control de producción con pallets y cajas
- **Editor de etiquetas** y generación de códigos de barras/QR
- **Extracción de datos de lonjas** usando Azure Document AI
- **Gráficos y analíticas** de ventas y stock
- Componentes basados en [NextUI](https://nextui.org/) y [shadcn/ui](https://ui.shadcn.com/) + Tailwind CSS
- Hooks y contextos personalizados (`useOrder`, `useStore`, etc.)

---

## 📂 Estructura Básica

```
src/
├── app/                # Rutas con App Router (login, admin, api…)
├── components/         # Componentes reutilizables
├── configs/            # Configuraciones (endpoints, navegación…)
├── context/            # Contextos de React para pedidos y almacenes
├── hooks/              # Hooks personalizados
├── services/           # Llamadas a la API Laravel
└── docs/               # Documentación completa del proyecto
```

---

## 📚 Documentación

### Documentación Principal

La documentación completa del proyecto está disponible en [`docs/README.md`](./docs/README.md).

**Incluye**:

- ✅ Arquitectura y estructura del proyecto
- ✅ Componentes UI y Admin
- ✅ Hooks personalizados y Context API
- ✅ Servicios API v2
- ✅ Formularios y validaciones
- ✅ Flujos funcionales completos
- ✅ Autenticación y autorización
- ✅ Estilos y design system
- ✅ Utilidades y helpers
- ✅ Exportaciones e integraciones
- ✅ Módulo de producción (en construcción)
- ✅ Observaciones críticas y mejoras recomendadas

**Comienza aquí**: [`docs/README.md`](./docs/README.md)

### Documentación Complementaria

- **Configuración de Entidades**: [`docs/configs/00-entities-config.md`](./docs/configs/00-entities-config.md)
- **Ejemplos de Configuración**: [`docs/examples/00-entity-config-examples.md`](./docs/examples/00-entity-config-examples.md)
- **Uso de Settings**: [`docs/23-uso-settings.md`](./docs/23-uso-settings.md)
- **Componentes de Filtros**: [`docs/components/Admin/Filters/GenericFilters/Types/`](./docs/components/Admin/Filters/GenericFilters/Types/)

### Documentación Técnica Adicional

Ver [docs/README.md](./docs/README.md) y [docs/00-docs-map.md](./docs/00-docs-map.md) para el índice completo.

---

## 🚀 Puesta en Marcha

### Requisitos Previos

- Node.js 18+
- npm o yarn
- Variables de entorno configuradas (ver `.env.example` si existe)

### Instalación

1. Clona el repositorio y entra en la carpeta:

   ```bash
   git clone <repo-url>
   cd brisapp-nextjs
   ```

2. Instala las dependencias:

   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   - Copia tu archivo de variables de entorno
   - Configura `NEXTAUTH_SECRET`, endpoints de API, etc.

4. Inicia el entorno de desarrollo:
   ```bash
   npm run dev
   ```

La aplicación se abrirá en `http://localhost:3000`.

### Scripts Disponibles

```bash
npm run dev      # Desarrollo (localhost:3000)
npm run build    # Build de producción
npm run start    # Iniciar servidor de producción
npm run lint     # Linter
```

---

## 📝 Contribución

Se agradecen issues y PRs para mejorar el proyecto.

**Antes de contribuir**:

- Revisa la [documentación completa](./docs/README.md)
- Consulta las [observaciones críticas](./docs/15-OBSERVACIONES-CRITICAS.md) para entender mejoras pendientes
- Revisa la documentación en `docs/` antes de añadir nuevos componentes o configuraciones

---

## ⚠️ Notas Importantes

- **API v2 es la versión activa**: Toda la documentación se enfoca en API v2
- **Producción en construcción**: El módulo de producción está en desarrollo activo
- **Documentación basada en código real**: Solo se documenta lo que existe
