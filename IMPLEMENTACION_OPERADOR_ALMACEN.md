# Implementación de Pantalla para Empresa Colaboradora de Almacén

## Descripción del Proyecto

Implementar una pantalla limitada para que empresas colaboradoras puedan gestionar únicamente un almacén específico asignado, sin acceso a otros menús o funcionalidades del sistema. La empresa colaboradora accede a través de un usuario que representa a la empresa, mostrando su logo y estableciendo una relación de colaboración.

## Arquitectura de la Solución

### 1. Rol de Usuario para Empresa Colaboradora
- **Rol**: `store_operator`
- **Concepto**: Usuario que representa a una empresa colaboradora
- **Permisos**: Acceso limitado solo a la gestión de un almacén específico asignado
- **Restricciones**: Sin acceso a navegación, menús administrativos u otras funcionalidades
- **Características**: Muestra logo de la empresa y establece relación de colaboración

### 2. Estructura de Componentes

#### A. Layout Simplificado
- **Componente**: `WarehouseOperatorLayout`
- **Características**:
  - Sin sidebar de navegación
  - Header con logo de la empresa colaboradora
  - Mensaje de colaboración
  - Sin menús de administración
  - Solo muestra el componente de gestión del almacén asignado

#### B. Nueva Ruta y Página
- **Ruta**: `/warehouse/[storeId]` o `/operator/[storeId]`
- **Acceso**: Solo usuarios con rol `store_operator`
- **Funcionalidad**: Muestra directamente el componente `Store` existente

## Pasos de Implementación

### Paso 1: Configuración de Roles

#### 1.1 Modificar `src/configs/roleConfig.js`
```javascript
const roleConfig = {
    "/admin": ["admin", "manager", "superuser"],
    "/production": ["admin", "worker", "superuser"],
    "/warehouse": ["store_operator"], // Nueva ruta para operadores
    "/operator": ["store_operator"], // Alternativa
    // ... resto de configuraciones existentes
};

export default roleConfig;
```

#### 1.2 Actualizar `src/configs/navgationConfig.js`
- **No agregar** configuraciones para `store_operator` ya que no tendrán navegación
- Los operadores usarán un layout completamente diferente

### Paso 2: Crear Layout Simplificado

#### 2.1 Crear `src/components/WarehouseOperatorLayout/index.js`
```javascript
"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function WarehouseOperatorLayout({ children, storeName }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [logoError, setLogoError] = useState(false);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  const handleLogoError = () => {
    setLogoError(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con logo de empresa colaboradora */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {/* Logo de la empresa colaboradora */}
              {session?.user?.companyLogoUrl && !logoError && (
                <div className="flex items-center space-x-3">
                  <img
                    src={session.user.companyLogoUrl}
                    alt={`Logo ${session.user.companyName || 'Empresa'}`}
                    className="h-8 w-auto"
                    onError={handleLogoError}
                  />
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">Colaboración con</span>
                    <span className="text-sm font-medium text-gray-900">
                      {session.user.companyName || 'Empresa Colaboradora'}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Fallback si no hay logo o hay error */}
              {(!session?.user?.companyLogoUrl || logoError) && (
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-gray-500 text-xs font-medium">
                      {session?.user?.companyName?.charAt(0) || 'E'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">Colaboración con</span>
                    <span className="text-sm font-medium text-gray-900">
                      {session?.user?.companyName || 'Empresa Colaboradora'}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="border-l border-gray-300 h-8 mx-4"></div>
              
              <h1 className="text-xl font-semibold text-gray-900">
                {storeName || "Gestión de Almacén"}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {session?.user?.name}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
```

### Paso 3: Crear Nueva Página

#### 3.1 Crear `src/app/warehouse/[storeId]/page.js`
```javascript
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Store } from "@/components/Admin/Stores/StoresManager/Store";
import WarehouseOperatorLayout from "@/components/WarehouseOperatorLayout";
import Loader from "@/components/Utilities/Loader";

export default function WarehouseOperatorPage({ params }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading] = useState(true);

  const { storeId } = params;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    if (status === "authenticated") {
      // Validar que el usuario tenga el rol correcto
      if (!session.user.role?.includes("store_operator")) {
        router.push("/unauthorized");
        return;
      }

      // Validar que el usuario tenga acceso a este almacén específico
      if (session.user.assignedStoreId !== parseInt(storeId)) {
        router.push("/unauthorized");
        return;
      }

      // Cargar datos del almacén
      loadStoreData();
    }
  }, [status, session, storeId, router]);

  const loadStoreData = async () => {
    try {
      // Validar que el usuario tenga acceso a este almacén
      if (session.user.assignedStoreId !== parseInt(storeId)) {
        router.push("/unauthorized");
        return;
      }

      // Aquí cargarías los datos del almacén desde la API
      // Por ejemplo, usando el servicio existente
      // const storeResponse = await fetch(`/api/v2/stores/${storeId}`);
      // const storeData = await storeResponse.json();
      
      // Por ahora, datos de ejemplo
      setStoreData({ 
        id: storeId, 
        name: "Almacén Principal",
        companyName: session.user.companyName 
      });
    } catch (error) {
      console.error("Error loading store data:", error);
      router.push("/unauthorized");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  if (!storeData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Almacén no encontrado
          </h2>
          <p className="text-gray-600">
            No tienes acceso a este almacén o no existe.
          </p>
        </div>
      </div>
    );
  }

  return (
    <WarehouseOperatorLayout storeName={storeData.name}>
      <div className="p-6">
        <Store
          storeId={parseInt(storeId)}
          onUpdateCurrentStoreTotalNetWeight={() => {}}
          onAddNetWeightToStore={() => {}}
          setIsStoreLoading={() => {}}
        />
      </div>
    </WarehouseOperatorLayout>
  );
}
```

### Paso 4: Modificaciones en el Backend/API

#### 4.1 Estructura de Usuario - Campos Opcionales
La entidad Usuario debe incluir los siguientes campos opcionales para empresas colaboradoras:
```javascript
{
  id: 123,
  name: "Representante Empresa",
  email: "contacto@empresacolaboradora.com",
  role: "store_operator",
  // Campos opcionales para empresas colaboradoras:
  assignedStoreId: 456,        // ID del almacén asignado (opcional)
  companyName: "Empresa Colaboradora S.L.", // Nombre de la empresa (opcional)
  companyLogoUrl: "https://ejemplo.com/logo.png", // URL del logo (opcional)
  // ... otros campos existentes
}
```

**Nota**: Estos campos son opcionales y solo se utilizan para usuarios con rol `store_operator`.

#### 4.2 Modificaciones en la Base de Datos
**Backend debe implementar:**

1. **Migración de Base de Datos:**
   ```sql
   ALTER TABLE users ADD COLUMN assigned_store_id INT NULL;
   ALTER TABLE users ADD COLUMN company_name VARCHAR(255) NULL;
   ALTER TABLE users ADD COLUMN company_logo_url TEXT NULL;
   
   -- Índice para optimizar consultas
   CREATE INDEX idx_users_assigned_store ON users(assigned_store_id);
   ```

2. **Validaciones en el Backend:**
   - `assignedStoreId` debe existir en la tabla de almacenes
   - `companyLogoUrl` debe ser una URL válida
   - Solo usuarios con rol `store_operator` pueden tener estos campos

3. **Endpoints a Modificar:**
   - `GET /api/v2/me` - Incluir los nuevos campos en la respuesta
   - `POST /api/v2/users` - Permitir crear usuarios con estos campos
   - `PUT /api/v2/users/:id` - Permitir actualizar estos campos
   - `GET /api/v2/users` - Incluir filtros por `assignedStoreId`

#### 4.3 Modificar Autenticación
En `src/app/api/auth/[...nextauth]/route.js`, asegurar que el token incluya:
```javascript
// En el callback jwt
async jwt({ token, user }) {
  if (user) {
    token.role = user.role;
    // Campos opcionales para store_operator
    if (user.assignedStoreId) {
      token.assignedStoreId = user.assignedStoreId;
    }
    if (user.companyName) {
      token.companyName = user.companyName;
    }
    if (user.companyLogoUrl) {
      token.companyLogoUrl = user.companyLogoUrl;
    }
  }
  return token;
}
```

#### 4.4 Validaciones de Seguridad en Backend
**El backend debe implementar:**

1. **Middleware de Validación:**
   - Verificar que usuarios con `assignedStoreId` solo puedan acceder a su almacén asignado
   - Validar que la URL del logo sea accesible (opcional)

2. **Endpoints Protegidos:**
   - Todos los endpoints relacionados con almacenes deben validar el `assignedStoreId`
   - Usuarios `store_operator` solo pueden ver/modificar su almacén asignado

3. **Logs de Auditoría:**
   - Registrar todas las acciones de usuarios `store_operator`
   - Incluir información de la empresa colaboradora en los logs

### Paso 5: Validaciones de Seguridad

#### 5.1 Middleware Adicional
Modificar `src/middleware.js` para validar acceso a almacenes específicos:

```javascript
// Agregar después de la validación de roles existente
if (pathname.startsWith("/warehouse/") && token.role === "store_operator") {
  const storeIdFromUrl = pathname.split("/")[2];
  if (token.assignedStoreId !== parseInt(storeIdFromUrl)) {
    console.log("🔐 [Middleware] Operador intentando acceder a almacén no asignado");
    const unauthorizedUrl = new URL("/unauthorized", req.url);
    return NextResponse.redirect(unauthorizedUrl);
  }
}
```

#### 5.2 Hook de Validación
Crear `src/hooks/useWarehouseAccess.js`:
```javascript
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useWarehouseAccess(storeId) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session.user.role === "store_operator") {
      if (session.user.assignedStoreId !== parseInt(storeId)) {
        router.push("/unauthorized");
      }
    }
  }, [session, status, storeId, router]);

  return {
    hasAccess: session?.user?.assignedStoreId === parseInt(storeId),
    isLoading: status === "loading"
  };
}
```

### Paso 6: Configuración de Rutas

#### 6.1 Actualizar `src/middleware.js` config
```javascript
export const config = {
  matcher: [
    "/admin/:path*", 
    "/production/:path*",
    "/warehouse/:path*", // Nueva ruta
    "/operator/:path*"   // Alternativa
  ],
};
```

## Consideraciones Adicionales

### 1. URLs Amigables
- Considerar usar nombres de almacén en lugar de IDs
- Ejemplo: `/warehouse/almacen-principal` en lugar de `/warehouse/123`

### 2. Responsive Design
- Asegurar que el layout funcione bien en dispositivos móviles
- El componente `Store` ya debe ser responsive
- El logo de la empresa debe adaptarse a diferentes tamaños de pantalla

### 3. Manejo de Logos
- Validar que la URL del logo sea accesible
- Implementar fallback si el logo no carga
- Considerar cache de logos para mejorar rendimiento
- Validar formatos de imagen soportados

### 4. Auditoría
- Registrar todas las acciones de la empresa colaboradora
- Mantener logs de acceso y modificaciones
- Incluir información de la empresa en los logs

### 5. Logout Automático
- Si la empresa intenta acceder a rutas no permitidas
- Redirigir automáticamente al login

### 6. Testing
- Probar acceso con diferentes roles
- Validar que no se pueda acceder a otros almacenes
- Verificar que la interfaz sea intuitiva
- Probar carga de logos desde diferentes URLs

## Archivos a Crear/Modificar

### Nuevos Archivos:
- `src/components/WarehouseOperatorLayout/index.js`
- `src/app/warehouse/[storeId]/page.js`
- `src/hooks/useWarehouseAccess.js`

### Archivos a Modificar:
- `src/configs/roleConfig.js`
- `src/middleware.js`
- `src/app/api/auth/[...nextauth]/route.js`

## Ventajas de esta Implementación

1. **Reutilización**: Aprovecha el componente `Store` existente
2. **Seguridad**: Control de acceso a nivel de ruta y almacén
3. **Simplicidad**: Interfaz minimalista sin distracciones
4. **Escalabilidad**: Fácil agregar más empresas colaboradoras
5. **Mantenimiento**: Cambios mínimos en código existente
6. **Flexibilidad**: Fácil modificar permisos o agregar funcionalidades
7. **Identidad Corporativa**: Muestra el logo y nombre de la empresa colaboradora
8. **Relación de Colaboración**: Establece claramente la relación entre empresas

## Próximos Pasos

### **Fase 1: Backend (Prioridad Alta)**
1. **Implementar migración de base de datos** para agregar los nuevos campos
2. **Modificar endpoints de API** para incluir los nuevos campos
3. **Implementar validaciones de seguridad** en el backend
4. **Configurar logs de auditoría** para empresas colaboradoras

### **Fase 2: Frontend (Después del Backend)**
1. **Implementar los cambios en el orden especificado**
2. **Crear el layout simplificado** con logo de empresa
3. **Implementar la nueva página** de gestión de almacén
4. **Configurar middleware** para validaciones de acceso

### **Fase 3: Testing y Configuración**
1. **Probar con usuarios de prueba** con diferentes configuraciones
2. **Validar carga de logos** desde diferentes URLs
3. **Configurar usuarios reales** con el nuevo rol
4. **Documentar el proceso** para administradores

### **Fase 4: Mejoras Futuras**
1. **Considerar agregar más funcionalidades** específicas para empresas colaboradoras
2. **Implementar cache de logos** para mejorar rendimiento
3. **Agregar más validaciones** de seguridad
4. **Mejorar la experiencia de usuario** basada en feedback
