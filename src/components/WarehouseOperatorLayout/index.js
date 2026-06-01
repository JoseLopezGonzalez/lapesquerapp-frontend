'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { notify } from '@/lib/notifications';
import { ChevronsUpDown, LogOut } from 'lucide-react';

export default function WarehouseOperatorLayout({ children, storeName }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [logoError, setLogoError] = useState(false);

  const handleLogout = async () => {
    try {
      // Primero revocar el token en el backend
      const { logout: logoutBackend } = await import('@/services/authService');
      await logoutBackend();
    } catch (err) {
      // Continuar con logout aunque falle el backend
      console.error('Error en logout del backend:', err);
    }

    await signOut({ redirect: false });

    notify.success({ title: 'Sesión cerrada' });
    setTimeout(() => {
      window.location.replace('/');
    }, 500);
  };

  const handleLogoError = () => {
    setLogoError(true);
  };

  // Generar iniciales del usuario
  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header con logo de empresa colaboradora */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
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
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-200">
                    <span className="text-xs font-medium text-gray-500">
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

              <div className="mx-4 h-8 border-l border-gray-300"></div>

              <h1 className="text-xl font-semibold text-gray-900">
                {storeName || 'Gestión de Almacén'}
              </h1>
            </div>

            <div className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-3 rounded-lg p-2 transition-colors hover:bg-gray-100">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={session?.user?.image} alt={session?.user?.name} />
                      <AvatarFallback className="rounded-lg bg-gray-100 font-medium text-gray-700">
                        {getUserInitials(session?.user?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden text-left sm:block">
                      <div className="text-sm font-medium text-gray-900">
                        {session?.user?.name || 'Usuario'}
                      </div>
                      <div className="text-xs text-gray-500">{session?.user?.email}</div>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 rounded-lg" align="end" sideOffset={4}>
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src={session?.user?.image} alt={session?.user?.name} />
                        <AvatarFallback className="rounded-lg bg-gray-100 font-medium text-gray-700">
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
      <div className="flex w-full grow items-center justify-center overflow-hidden p-20">
        {children}
      </div>
    </div>
  );
}
