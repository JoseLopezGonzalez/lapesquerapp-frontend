'use client';

import React, { useEffect, useState } from 'react';
import { IoFilter } from 'react-icons/io5';
import { GenericFiltersModal } from './GenericFiltersModal';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export const GenericFilters = ({ data }) => {
    const { configFiltersGroup, updateFilters } = data;

    const [localFiltersGroup, setLocalFiltersGroup] = useState({
        search: { label: '', value: '', filters: [] },
        groups: [],
    });
    const [numberOfActiveFilters, setNumberOfActiveFilters] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        // Inicializar los filtros locales agrupados
        const { search, groups } = configFiltersGroup;
        const initialFiltersGroup = {
            search: {
                ...search,
                filters: search.filters.map((filter) => ({
                    ...filter,
                    value: filter.value || '',
                })),
            },
            groups: groups.map((group) => ({
                ...group,
                filters: group.filters.map((filter) => ({
                    ...filter,
                    value: filter.value || (filter.type === 'dateRange' ? { from: null, to: null } : ''),
                })),
            })),
        };
        setLocalFiltersGroup(initialFiltersGroup);
    }, [configFiltersGroup]);

    useEffect(() => {
        // Actualizar el número de filtros activos
        const activeFiltersCount =
            (localFiltersGroup.search.filters[0]?.value ? 1 : 0) +
            localFiltersGroup.groups.reduce((count, group) => {
                return (
                    count +
                    group.filters.reduce((groupCount, filter) => {
                        if (filter.type === 'dateRange') {
                            if (filter.value?.from || filter.value?.to) groupCount++;
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
        setLocalFiltersGroup((prevGroups) => {
            if (groupName === 'search') {
                return {
                    ...prevGroups,
                    search: {
                        ...prevGroups.search,
                        filters: prevGroups.search.filters.map((filter) =>
                            filter.name === filterName ? { ...filter, value } : filter
                        ),
                    },
                };
            }

            return {
                ...prevGroups,
                groups: prevGroups.groups.map((group) =>
                    group.name === groupName
                        ? {
                            ...group,
                            filters: group.filters.map((filter) =>
                                filter.name === filterName ? { ...filter, value } : filter
                            ),
                        }
                        : group
                ),
            };
        });
    };

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const handleFiltersSubmit = () => {
        // Formatear los filtros para enviarlos globalmente, filtrando los vacíos
        const allFilters = [
            ...localFiltersGroup.search.filters.map(({ name, value, type }) => ({
                name,
                value,
                type,
            })),
            ...localFiltersGroup.groups.flatMap((group) =>
                group.filters.map(({ name, value, type }) => ({
                    name,
                    value,
                    type,
                }))
            ),
        ];

        // Filtrar los filtros vacíos
        const formattedFilters = allFilters.filter((filter) => {
            if (filter.type === 'dateRange') {
                return filter.value?.from || filter.value?.to;
            } else if (Array.isArray(filter.value)) {
                return filter.value.length > 0;
            } else if (typeof filter.value === 'string') {
                return filter.value.trim().length > 0;
            } else {
                return filter.value !== null && filter.value !== undefined && filter.value !== '';
            }
        });

        updateFilters(formattedFilters);
        closeModal();
    };

    const handleFiltersReset = () => {
        const { search, groups } = configFiltersGroup;
        const resetFiltersGroup = {
            search: {
                ...search,
                filters: search.filters.map((filter) => ({
                    ...filter,
                    value: '',
                })),
            },
            groups: groups.map((group) => ({
                ...group,
                filters: group.filters.map((filter) => ({
                    ...filter,
                    value: filter.type === 'dateRange' ? { from: null, to: null } : '',
                })),
            })),
        };

        setLocalFiltersGroup(resetFiltersGroup);
        updateFilters([]);
        closeModal();
    };

    return (
        <>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                    <Button
                        variant="secondary"
                        size="sm"
                    >
                        <IoFilter className="h-4 w-4" />
                        <span className='hidden xl:flex'>Filtros</span>
                        {numberOfActiveFilters > 0 && (
                            <span className="inline-flex items-center gap-1.5 py-0.5 px-1.5 rounded-full text-xs font-medium border border-foreground-200 text-muted-foreground">
                                {numberOfActiveFilters}
                            </span>
                        )}
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Filtros</DialogTitle>
                        <GenericFiltersModal
                            filtersGroup={localFiltersGroup}
                            isOpen={isModalOpen}
                            onClose={closeModal}
                            onSubmit={handleFiltersSubmit}
                            onReset={handleFiltersReset}
                            onFilterChange={handleFilterChange}
                        />
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </>
    );
};
