"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { ChevronsUpDown, LogOut } from "lucide-react";

export default function WarehouseOperatorLayout({ children, storeName }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [logoError, setLogoError] = useState(false);

  const handleLogout = async () => {
    // Prevenir múltiples ejecuciones simultáneas
    if (sessionStorage.getItem('__is_logging_out__') === 'true') {
      return;
    }
    
    try {
      // Marcar que se está ejecutando un logout
      sessionStorage.setItem('__is_logging_out__', 'true');
      
      // Primero revocar el token en el backend
      const { logout: logoutBackend } = await import('@/services/authService');
      await logoutBackend();
    } catch (err) {
      // Continuar con logout aunque falle el backend
      console.error('Error en logout del backend:', err);
    }
    
    await signOut({ redirect: false });
    
    // Limpiar la bandera antes de redirigir
    sessionStorage.removeItem('__is_logging_out__');
    
    router.push("/");
  };

  const handleLogoError = () => {
    setLogoError(true);
  };

  // Generar iniciales del usuario
  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
                    className="h-14 w-auto"
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
            
            <div className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-3 rounded-lg p-2 hover:bg-gray-100 transition-colors">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={session?.user?.image} alt={session?.user?.name} />
                      <AvatarFallback className="rounded-lg bg-gray-100 text-gray-700 font-medium">
                        {getUserInitials(session?.user?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium text-gray-900">
                        {session?.user?.name || 'Usuario'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {session?.user?.email}
                      </div>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 rounded-lg"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src={session?.user?.image} alt={session?.user?.name} />
                        <AvatarFallback className="rounded-lg bg-gray-100 text-gray-700 font-medium">
                          {getUserInitials(session?.user?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                          {session?.user?.name || 'Usuario'}
                        </span>
                        <span className="truncate text-xs text-gray-500">
                          {session?.user?.email}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <div className='grow flex items-center justify-center w-full overflow-hidden p-20'>
        {children}
        </div>
    </div>
  );
}
