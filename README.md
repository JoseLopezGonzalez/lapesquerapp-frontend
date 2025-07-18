# BrisApp – Panel de Administración

BrisApp es la interfaz web desarrollada en **Next.js** para gestionar la plataforma pesquera BlueApp/PesquerApp. Actúa como cliente para la API Laravel y proporciona todas las herramientas necesarias para la administración diaria.

---

## ✨ Características principales

- **Next.js 15** con App Router y componentes de servidor/cliente.
- **Autenticación** mediante [NextAuth](https://next-auth.js.org/) conectada a la API.
- **Panel de administración** con múltiples módulos (almacenes, pedidos, productos, clientes, transportes…).
- **Gestor de pedidos** y control de producción con pallets y cajas.
- **Editor de etiquetas** y generación de códigos de barras/QR.
- **Extracción de datos de lonjas** usando Azure Document AI.
- **Gráficos y analíticas** de ventas y stock.
- Componentes basados en [NextUI](https://nextui.org/) y [shadcn/ui](https://ui.shadcn.com/) + Tailwind CSS.
- Hooks y contextos personalizados (`useOrder`, `useStore`, etc.).

---

## 📂 Estructura básica

```
src/
├── app/                # Rutas con App Router (login, admin, api…)
├── components/         # Componentes reutilizables
├── configs/            # Configuraciones (endpoints, navegación…)
├── context/            # Contextos de React para pedidos y almacenes
├── hooks/              # Hooks personalizados
├── services/           # Llamadas a la API Laravel
└── docs/               # Documentación de componentes y configuraciones
```

Consulta `notes.md` para un diagrama más detallado de carpetas y componentes.

---

## 🚀 Puesta en marcha

1. Clona el repositorio y entra en la carpeta
   ```bash
   git clone <repo-url>
   cd brisapp-nextjs
   ```
2. Instala las dependencias
   ```bash
   npm install
   ```
3. Copia tu archivo de variables de entorno (`NEXTAUTH_SECRET`, endpoints de API, etc.).
4. Inicia el entorno de desarrollo
   ```bash
   npm run dev
   ```

La aplicación se abrirá en `http://localhost:3000`.

---

## 📝 Contribución

Se agradecen issues y PRs para mejorar el proyecto. Revisa la documentación en `docs/` antes de añadir nuevos componentes o configuraciones.

