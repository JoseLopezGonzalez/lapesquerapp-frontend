'use client';

import React from 'react';
import { Modal, Header, Body, Footer } from '@/components/Admin/Modals/GenericModal';
import { GenericFiltersModalContent } from './GenericFiltersModalContent';
import { CheckIcon } from '@heroicons/react/20/solid';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

export const GenericFiltersModal = ({
    filtersGroup,
    isOpen,
    onClose,
    onFilterChange,
    onSubmit,
    onReset,
}) => {
    const applyFilters = () => {
        onSubmit();
        onClose();
    };

    const resetFilters = () => {
        onReset();
        onClose();
    };

    return (
        <div className='py-3 pt-8 flex flex-col gap-2'>
            <div>
                <GenericFiltersModalContent
                    filtersGroup={filtersGroup}
                    onFilterChange={onFilterChange}
                />
            </div>
            <div className='flex justify-end gap-3 '>
                <Button
                    onClick={resetFilters}
                    variant='outline'
                >
                    <ArrowPathIcon className="h-4 w-4" />
                    Resetear
                </Button>
                <Button
                    onClick={applyFilters}
                >
                    <CheckIcon className="h-4 w-4" />
                    Aplicar
                </Button>
            </div>

        </div>
    );
};
