'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ArrowLeftIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Navbar from './Navbar';
import { goBack } from '@/helpers/window/goBack';

export default function Layout({ children, title }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className='p-2 h-full'>
            <div className='bg-neutral-800 rounded-2xl h-full p-1 overflow-hidden'>
                {/* Sidebar para dispositivos móviles */}
                <Transition.Root show={sidebarOpen} as={Fragment}>
                    <Dialog as="div" className="relative z-40 md:hidden" onClose={setSidebarOpen}>
                        <Transition.Child
                            as={Fragment}
                            enter="transition-opacity ease-linear duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="transition-opacity ease-linear duration-300"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-neutral-600 dark:bg-neutral-900 bg-opacity-75 dark:bg-opacity-75" />
                        </Transition.Child>

                        <div className="fixed inset-0 z-40 flex">
                            <Transition.Child
                                as={Fragment}
                                enter="transition ease-in-out duration-300 transform"
                                enterFrom="-translate-x-full"
                                enterTo="translate-x-0"
                                leave="transition ease-in-out duration-300 transform"
                                leaveFrom="translate-x-0"
                                leaveTo="-translate-x-full"
                            >
                                <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-white dark:bg-neutral-900">
                                    <Transition.Child
                                        as={Fragment}
                                        enter="ease-in-out duration-300"
                                        enterFrom="opacity-0"
                                        enterTo="opacity-100"
                                        leave="ease-in-out duration-300"
                                        leaveFrom="opacity-100"
                                        leaveTo="opacity-0"
                                    >
                                        <div className="absolute top-0 right-0 -mr-12 pt-2">
                                            <button
                                                type="button"
                                                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                                                onClick={() => setSidebarOpen(false)}
                                            >
                                                <span className="sr-only">Close sidebar</span>
                                                <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                                            </button>
                                        </div>
                                    </Transition.Child>

                                    <Navbar />
                                </Dialog.Panel>
                            </Transition.Child>
                            <div className="w-14 flex-shrink-0" aria-hidden="true" />
                        </div>
                    </Dialog>
                </Transition.Root>

                <div className='flex flex-row h-full'>

                    {/* Sidebar estático para pantallas grandes */}
                    <div className="hidden h-full md:flex md:w-72 md:flex-col p-1">
                        <div className="flex h-full w-full bg-neutral-950 rounded-2xl">
                            <Navbar />
                        </div>
                    </div>

                    {/* Contenido principal */}
                    <div className="h-full flex flex-1 flex-col w-full">
                        {/* Barra superior para dispositivos móviles */}
                        <div className="sticky top-0 z-10 bg-white dark:bg-transparent px-3 py-3 sm:pl-3 sm:pt-3 md:hidden flex items-center justify-between backdrop-blur-sm">
                            <button
                                type="button"
                                className="inline-flex px-2 py-2 items-center justify-center rounded-lg text-neutral-500 dark:text-white hover:text-neutral-900 dark:hover:text-neutral-300"
                                onClick={goBack} // Usamos la función `goBack` basada en `window.history`
                            >
                                <span className="sr-only">Go Back</span>
                                <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
                            </button>
                            <button
                                type="button"
                                className="inline-flex px-2 py-2 items-center justify-center rounded-md text-neutral-500 dark:text-white hover:text-neutral-900 dark:hover:text-neutral-300"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <span className="sr-only">Open sidebar</span>
                                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                            </button>
                        </div>
                        <main className="flex-1  h-full w-full shadow-md overflow-y-auto">
                            <div className="absolute pl-5 pt-4 md:block hidden">
                                <button
                                    type="button"
                                    className="inline-flex px-2 py-2 items-center justify-center rounded-lg text-neutral-500 dark:text-white hover:text-neutral-900 dark:hover:bg-neutral-600 dark:hover:text-neutral-300"
                                    onClick={goBack}
                                >
                                    <span className="sr-only">Go Back</span>
                                    <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
                                </button>
                            </div>

                            <div className="h-full">
                                <div className="h-full">
                                    {/* Contenido dinámico */}
                                    <div className="pt-2 md:pt-4 h-full">{children}</div>
                                </div>
                            </div>
                        </main>
                    </div>

                </div>



            </div>
        </div>
    );
}
