import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function SlidingPanel({children, title, className , buttonTitle}) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Botón para abrir el panel */}
            <button
                onClick={() => setIsOpen(true)}
                className={`${className || 'bg-sky-600 text-white px-2 py-1.5 rounded-2xl w-full text-sm'}`}>
                {buttonTitle}
            </button>

            {/* Panel deslizante */}
            <Transition.Root show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={setIsOpen}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-in-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in-out duration-300"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-hidden">
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                                <Transition.Child
                                    as={Fragment}
                                    enter="transform transition ease-in-out duration-300"
                                    enterFrom="translate-x-full"
                                    enterTo="translate-x-0"
                                    leave="transform transition ease-in-out duration-300"
                                    leaveFrom="translate-x-0"
                                    leaveTo="translate-x-full"
                                >
                                    <Dialog.Panel className="pointer-events-auto w-full max-w-md p-2">
                                        <div className="flex h-full flex-col bg-neutral-900 py-6 shadow-xl rounded-2xl">
                                            <div className="px-4 sm:px-6">
                                                <div className="flex items-start justify-between ">
                                                    <Dialog.Title className="text-lg font-medium text-white">
                                                       {title}
                                                    </Dialog.Title>
                                                    <div className="ml-3 flex h-7 items-center">
                                                        <button
                                                            type="button"
                                                            className="rounded-md ¡ text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                                            onClick={() => setIsOpen(false)}
                                                        >
                                                            <span className="sr-only">Cerrar panel</span>
                                                            {/* Ícono de cierre (X) */}
                                                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="relative mt-6 flex-1 px-4 sm:px-6">
                                                {/* Contenido del panel */}
                                               {children}
                                            </div>
                                        </div>
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>
        </>
    );
}
