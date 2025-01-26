'use client';

import Link from 'next/link';
import { Disclosure } from '@headlessui/react';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { NAVBAR_LOGO } from '@/configs/config';
import { classNames } from '@/helpers/styles/classNames';
import { navigationConfig } from '@/configs/navgationConfig';

export default function Navbar() {
    const currentPath = usePathname();
    const { data: session } = useSession();
    const userRoles = session?.user?.role || []; // Roles del usuario actual
    const roles = Array.isArray(userRoles) ? userRoles : [userRoles]; // Normalizar roles como array

    const handleLogout = async () => {
        try {
            await signOut({ redirect: false });
            window.location.href = '/login';
            toast.success('Sesión cerrada correctamente');
        } catch (err) {
            toast.error(err.message || 'Error al cerrar sesión');
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
                children: item.children
                    ? item.children.filter((child) =>
                        child.allowedRoles?.some((role) => roles.includes(role))
                    )
                    : null,
            }));

    const filteredNavigation = filterNavigation(navigationConfig);

    return (
        <>
            <div className="flex flex-grow flex-col  pt-5 pb-4 gap-5 justify-between h-full" >
                <div className="mt-3 flex flex-shrink-0 items-center px-7">
                    <img className="h-14 w-auto" src={NAVBAR_LOGO} alt="BlueApp" />
                </div>
                <div className="mb-5 flex flex-grow flex-col overflow-y-auto  pr-4">
                    <div className=" text-sm font-medium px-8 mb-2 mt-8 text-neutral-400">
                        Navegación
                    </div>
                    <nav className="h-full flex-1 space-y-1 px-5 overflow-y-auto " >
                        {filteredNavigation.map((item) =>
                            !item.children ? (
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
                                            <Disclosure.Button
                                                className={classNames(
                                                    item.children.some(
                                                        (child) => child.href === currentPath
                                                    )
                                                        ? 'text-sky-600 dark:text-white'
                                                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white',
                                                    'group w-full flex items-center pl-2 pr-1 py-2 text-left text-md font-medium rounded-md'
                                                )}
                                            >
                                                <item.icon
                                                    className={classNames(
                                                        item.children.some(
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
                                            </Disclosure.Button>
                                            <Disclosure.Panel className="space-y-1">
                                                {item.children.map((subItem) => (
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
                                            </Disclosure.Panel>
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
                            <div>
                                <img
                                    className="inline-block h-9 w-9 rounded-full"
                                    src="/app/user.png"
                                    alt=""
                                />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-neutral dark:text-white inline-flex items-center justify-center">
                                    Administración{' '}
                                </p>
                                <p
                                    onClick={handleLogout}
                                    className="text-xs font-medium text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-white"
                                >
                                    Perfil
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
