'use client';

import React, { useEffect, useState } from 'react';
import { IoFilter } from 'react-icons/io5';
import { GenericFiltersModal } from './GenericFiltersModal';

export const GenericFilters = ({ data }) => {
    const { configFilters, updateFilters } = data;

    const [localFilters, setLocalFilters] = useState([]);
    const [numberOfActiveFilters, setNumberOfActiveFilters] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        // Inicializar el estado local de filtros
        const initialFilters = configFilters.map((filter) => ({
            ...filter,
            value: filter.value || (filter.type === 'dateRange' ? { start: '', end: '' } : ''), // Inicializamos valores
        }));
        setLocalFilters(initialFilters);
    }, [configFilters]);

    /* Actualizar NumberOfActiveFilters */
    useEffect(() => {
        const activeFiltersCount = localFilters.reduce((count, filter) => {
            if (filter.type === 'dateRange') {
                if (filter.value.start || filter.value.end) count++;
            } else if (Array.isArray(filter.value)) {
                if (filter.value.length > 0) count++;
            } else if (filter.value) {
                count++;
            }
            return count;
        }, 0);
        setNumberOfActiveFilters(activeFiltersCount);
    }, [localFilters]);

    const handleFilterChange = (name, value) => {
        setLocalFilters((prevFilters) =>
            prevFilters.map((filter) =>
                filter.name === name ? { ...filter, value } : filter
            )
        );
    };

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const handleFiltersSubmit = () => {
        // Actualizar filtros globales

        /* Formatear Local Filters para que solo contengan name y value y type*/
        const formattedFilters = localFilters.map(({ name, value, type }) => ({
            name,
            value,
            type,
        }));
        updateFilters(formattedFilters);


        closeModal();
    };

    const handleFiltersReset = () => {
        const resetFilters = configFilters.map((filter) => ({
            ...filter,
            value: filter.value || (filter.type === 'dateRange' ? { start: '', end: '' } : ''), // Inicializamos valores
        }));
        setLocalFilters(resetFilters);
        updateFilters(resetFilters);
        closeModal();
    };

    return (
        <>
            <div className="flex justify-between items-center">
                <button
                    onClick={openModal}
                    type="button"
                    className="py-2 px-3 flex items-center gap-x-2 text-sm font-medium rounded-lg border shadow-sm bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800"
                >
                    <IoFilter className="h-4 w-4" />
                    Filtros
                    {numberOfActiveFilters > 0 && (
                        <span className="inline-flex items-center gap-1.5 py-0.5 px-1.5 rounded-full text-xs font-medium border border-neutral-700 text-neutral-300">
                            {numberOfActiveFilters}
                        </span>
                    )}
                </button>
            </div>
            <GenericFiltersModal
                filters={localFilters}
                isOpen={isModalOpen}
                onClose={closeModal}
                onSubmit={handleFiltersSubmit}
                onReset={handleFiltersReset}
                onFilterChange={handleFilterChange}
            />
        </>
    );
};
