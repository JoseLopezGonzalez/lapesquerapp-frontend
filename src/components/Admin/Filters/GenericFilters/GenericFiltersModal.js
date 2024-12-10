'use client';

import React from 'react';
import { Modal, Header, Body, Footer } from '@/components/Admin/Modals/GenericModal';
import { GenericFiltersModalContent } from './GenericFiltersModalContent';
import { CheckIcon } from '@heroicons/react/20/solid';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export const GenericFiltersModal = ({ filters, isOpen, onClose, onFilterChange , onSubmit, onReset }) => {

    const applyFilters = () => {
        /* data.onClick.submit(); */
        onSubmit();
        onClose();
    };

    const resetFilters = () => {
        /* data.onClick.reset(); */
        onReset();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <Header title="Filtros" onBack={onClose} />
            <Body>
                <GenericFiltersModalContent
                    filters={filters}
                    onFilterChange={onFilterChange}
                    /* searchFilter={data.search} */
                />
            </Body>
            <Footer>
                <button
                    onClick={resetFilters}
                    type="button"
                    className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800"
                >
                    <ArrowPathIcon className="h-4 w-4" />
                    Resetear
                </button>
                <button
                    onClick={applyFilters}
                    type="button"
                    className="py-1.5 px-3 inline-flex items-center gap-1 text-sm rounded-lg bg-sky-600 text-white hover:bg-sky-700"
                >
                    <CheckIcon className="h-4 w-4" />
                    Aplicar
                </button>
            </Footer>
        </Modal>
    );
};
