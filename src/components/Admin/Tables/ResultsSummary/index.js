'use client'

import React from 'react';
import { formatInteger } from "@/helpers/formats/numbers/formatNumbers";

export const ResultsSummary = ({ 
    totalItems = 0, 
    selectedCount = 0, 
    loading = false 
}) => {
    if (loading) {
        return (
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Cargando...
            </div>
        );
    }

    if (selectedCount > 0) {
        return (
            <div className="text-sm text-neutral-600 dark:text-neutral-400 text-nowrap">
                <span className="font-semibold">{formatInteger(selectedCount)}</span> de <span className="font-semibold">{formatInteger(totalItems)}</span> resultados seleccionados
            </div>
        );
    }

    return (
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
            <span className="font-semibold text-neutral-800 dark:text-neutral-200 mr-1">
                {formatInteger(totalItems)}
            </span>
            resultados
        </div>
    );
}; 