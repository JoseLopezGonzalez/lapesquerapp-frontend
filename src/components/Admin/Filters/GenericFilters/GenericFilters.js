'use client';

import React, { useEffect, useState } from 'react';
import { IoFilter } from 'react-icons/io5';
import { GenericFiltersModal } from './GenericFiltersModal';

export const GenericFilters = ({ data }) => {
    const { configFiltersGroup, updateFilters } = data;

    const [localFiltersGroup, setLocalFiltersGroup] = useState([]);
    const [numberOfActiveFilters, setNumberOfActiveFilters] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        // Inicializar los filtros locales agrupados
        const initialFiltersGroup = configFiltersGroup.map((group) => ({
            ...group,
            filters: group.filters.map((filter) => ({
                ...filter,
                value: filter.value || (filter.type === 'dateRange' ? { start: '', end: '' } : ''), // Inicializamos valores
            })),
        }));
        setLocalFiltersGroup(initialFiltersGroup);
    }, [configFiltersGroup]);

    /* Actualizar NumberOfActiveFilters */
    useEffect(() => {
        const activeFiltersCount = localFiltersGroup.reduce((count, group) => {
            return (
                count +
                group.filters.reduce((groupCount, filter) => {
                    if (filter.type === 'dateRange') {
                        if (filter.value.start || filter.value.end) groupCount++;
                    } else if (Array.isArray(filter.value)) {
                        if (filter.value.length > 0) groupCount++;
                    } else if (filter.value) {
                        groupCount++;
                    }
                    return groupCount;
                }, 0)
            );
        }, 0);
        setNumberOfActiveFilters(activeFiltersCount);
    }, [localFiltersGroup]);

    const handleFilterChange = (groupName, filterName, value) => {
        setLocalFiltersGroup((prevGroups) =>
            prevGroups.map((group) =>
                group.name === groupName
                    ? {
                          ...group,
                          filters: group.filters.map((filter) =>
                              filter.name === filterName ? { ...filter, value } : filter
                          ),
                      }
                    : group
            )
        );
    };

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const handleFiltersSubmit = () => {
        // Formatear los filtros para enviarlos globalmente
        const formattedFilters = localFiltersGroup.flatMap((group) =>
            group.filters.map(({ name, value, type }) => ({
                name,
                value,
                type,
            }))
        );
        updateFilters(formattedFilters);
        closeModal();
    };

    const handleFiltersReset = () => {
        const resetFiltersGroup = configFiltersGroup.map((group) => ({
            ...group,
            filters: group.filters.map((filter) => ({
                ...filter,
                value: filter.value || (filter.type === 'dateRange' ? { start: '', end: '' } : ''), // Inicializamos valores
            })),
        }));
        setLocalFiltersGroup(resetFiltersGroup);
        updateFilters(resetFiltersGroup.flatMap((group) => group.filters));
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
                filtersGroup={localFiltersGroup}
                isOpen={isModalOpen}
                onClose={closeModal}
                onSubmit={handleFiltersSubmit}
                onReset={handleFiltersReset}
                onFilterChange={handleFilterChange}
            />
        </>
    );
};
