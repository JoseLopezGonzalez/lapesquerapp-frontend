'use client';

import React, { useState } from 'react';
import { IoFilter } from 'react-icons/io5';
import { GenericFiltersModal } from './GenericFiltersModal';

export const GenericFilters = ({ data }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

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
                    {data?.numberOfActiveFilters > 0 && (
                        <span className="inline-flex items-center gap-1.5 py-0.5 px-1.5 rounded-full text-xs font-medium border border-neutral-700 text-neutral-300">
                            {data.numberOfActiveFilters}
                        </span>
                    )}
                </button>
            </div>
            <GenericFiltersModal data={data} isOpen={isModalOpen} onBack={closeModal} />
        </>
    );
};
