'use client';

import { ArrowLeftIcon, XMarkIcon } from '@heroicons/react/20/solid';

export const Header = ({ title, onClose, onBack, children }) => {
  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-2">
        {onBack && (
          <button
            onClick={onBack}
            type="button"
            className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-sm text-neutral-400 hover:bg-neutral-200 hover:text-neutral-900 focus:outline-none dark:hover:bg-neutral-600 dark:hover:text-white"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
        )}
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
          {title || children}
        </h3>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-neutral-500 hover:text-neutral-800 dark:text-white dark:hover:text-neutral-300"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};
