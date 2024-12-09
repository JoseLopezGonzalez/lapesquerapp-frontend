'use client'

import { ArrowLeftIcon, XMarkIcon } from "@heroicons/react/20/solid";

export const Header = ({ title, onClose, onBack, children }) => {
    return (
        <div className="flex items-center justify-between p-4  ">
            <div className="flex items-center gap-2">
                {onBack && (
                    <button onClick={onBack} type="button" className="text-neutral-400 bg-transparent hover:bg-neutral-200 hover:text-neutral-900 dark:hover:text-white dark:hover:bg-neutral-600 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center  focus:outline-none " >
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                )}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title || children}</h3>
            </div>
            {
                onClose && (
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-800 dark:text-white dark:hover:text-gray-300"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                )
            }
        </div >
    );
};
