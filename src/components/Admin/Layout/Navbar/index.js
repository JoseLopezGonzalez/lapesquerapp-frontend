'use client';

import Link from 'next/link';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { flushSync } from 'react-dom';
import { NAVBAR_LOGO } from '@/configs/config';
import { classNames } from '@/helpers/styles/classNames';
import { navigationConfig } from '@/configs/navgationConfig';
import { ArrowRightStartOnRectangleIcon } from '@heroicons/react/20/solid';
import { UserIcon } from 'lucide-react';
import { useLogout } from "@/context/LogoutContext";

export default function Navbar() {
    const currentPath = usePathname();
    const { data: session } = useSession();
    const userRoles = session?.user?.role || []; // Roles del usuario actual
    const roles = Array.isArray(userRoles) ? userRoles : [userRoles]; // Normalizar roles como array

    const username = session?.user?.name || 'Desconocido'; // Nombre del usuario actual
    const { setIsLoggingOut } = useLogout();

    const handleLogout = async () => {
        // Mostrar diálogo INMEDIATAMENTE usando flushSync para render síncrono
        flushSync(() => {
            setIsLoggingOut(true);
        });
        
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
            
            // Luego cerrar sesión en NextAuth
            await signOut({ redirect: false });
            
            // NO cerrar el diálogo - mantenerlo visible durante la redirección
            // Redirigir directamente usando replace() para evitar que aparezca el home
            window.location.replace('/');
        } catch (err) {
            // Incluso si falla el logout del backend, continuar con el logout del cliente
            await signOut({ redirect: false });
            
            // NO cerrar el diálogo - mantenerlo visible durante la redirección
            // Redirigir directamente usando replace() para evitar que aparezca el home
            window.location.replace('/');
        }
    };

    // Filtrar elementos del menú basados en roles
    const filterNavigation = (items) =>
        items
            .filter((item) =>
                item.allowedRoles?.some((role) => roles.includes(role))
            )
            .map((item) => ({
                ...item,
                childrens: item.childrens
                    ? item.childrens.filter((child) =>
                        child.allowedRoles?.some((role) => roles.includes(role))
                    )
                    : null,
            }));

    const filteredNavigation = filterNavigation(navigationConfig);

    return (
        <>
            <div className="flex w-full flex-col pt-5 pb-4 gap-5 justify-between h-full" >
                <div className="mt-3 flex flex-shrink-0 items-center px-7">
                    <img className="h-14 w-auto" src={NAVBAR_LOGO} alt="BlueApp" />
                </div>
                <div className="mb-5 flex flex-grow flex-col overflow-y-auto  pr-4">
                    <div className=" text-sm font-medium px-8 mb-2 mt-8 text-neutral-400">
                        Navegación
                    </div>
                    <nav className="h-full flex-1 space-y-1 px-5 overflow-y-auto " >
                        {filteredNavigation.map((item) =>
                            !item.childrens ? (
                                <div key={item.name}>
                                    <Link
                                        href={item.href}
                                        className={classNames(
                                            item.href === currentPath
                                                ? 'text-sky-600 dark:text-white'
                                                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white',
                                            'group w-full flex items-center pl-2 py-2 text-md font-medium rounded-md'
                                        )}
                                    >
                                        <item.icon
                                            className={classNames(
                                                item.href === currentPath
                                                    ? 'text-sky-600 dark:text-white'
                                                    : 'text-neutral-400 group-hover:text-neutral-500 dark:group-hover:text-white',
                                                'mr-3 flex-shrink-0 h-6 w-6'
                                            )}
                                            aria-hidden="true"
                                        />
                                        {item.name}
                                    </Link>
                                </div>
                            ) : (
                                <Disclosure as="div" key={item.name} className="space-y-1">
                                    {({ open }) => (
                                        <>
                                            <DisclosureButton
                                                className={classNames(
                                                    item.childrens.some(
                                                        (child) => child.href === currentPath
                                                    )
                                                        ? 'text-sky-600 dark:text-white'
                                                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white',
                                                    'group w-full flex items-center pl-2 pr-1 py-2 text-left text-md font-medium rounded-md'
                                                )}
                                            >
                                                <item.icon
                                                    className={classNames(
                                                        item.childrens.some(
                                                            (child) => child.href === currentPath
                                                        )
                                                            ? 'text-white group-hover:text-white'
                                                            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 group-hover:text-white',
                                                        'mr-3 h-6 w-6 flex-shrink-0'
                                                    )}
                                                    aria-hidden="true"
                                                />
                                                <span className="flex-1">{item.name}</span>
                                                <svg
                                                    className={classNames(
                                                        open
                                                            ? 'text-neutral-400 rotate-90'
                                                            : 'text-neutral-300',
                                                        'ml-3 h-5 w-5 flex-shrink-0 transform transition-colors duration-150 ease-in-out group-hover:text-neutral-400'
                                                    )}
                                                    viewBox="0 0 20 20"
                                                    aria-hidden="true"
                                                >
                                                    <path d="M6 6L14 10L6 14V6Z" fill="currentColor" />
                                                </svg>
                                            </DisclosureButton>
                                            <DisclosurePanel className="space-y-1">
                                                {item.childrens.map((subItem) => (
                                                    <Link
                                                        key={subItem.name}
                                                        href={subItem.href}
                                                        className={classNames(
                                                            subItem.href === currentPath
                                                                ? 'text-white'
                                                                : 'text-neutral-400 hover:text-white',
                                                            'group flex w-full items-center rounded-md py-2 pl-11 pr-2 text-sm font-medium'
                                                        )}
                                                    >
                                                        {subItem.name}
                                                    </Link>
                                                ))}
                                            </DisclosurePanel>
                                        </>
                                    )}
                                </Disclosure>
                            )
                        )}
                    </nav>
                </div>
                <div className="flex flex-shrink-0 p-4">
                    <div className="group block w-full flex-shrink-0">
                        <div className="flex items-center">
                            <div className='bg-neutral-400 rounded-xl p-1'>
                                <UserIcon className="h-8 w-8 text-neutral-900 dark:text-white" />

                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-neutral dark:text-white inline-flex items-center justify-center">
                                    {username}{' '}
                                </p>
                                <button
                                    onClick={handleLogout}
                                    className="flex text-xs font-medium text-neutral-400  hover:text-red-500"
                                >
                                    Cerrar sesión
                                    <ArrowRightStartOnRectangleIcon className="h-4 w-4 ml-1" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
