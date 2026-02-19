'use client';

import { useQuery } from '@tanstack/react-query';
import { rawMaterialReceptionService } from '@/services/domain/raw-material-receptions/rawMaterialReceptionService';

/**
 * Hook para obtener el desglose diario de calibres por especie (API v2).
 * Con speciesId "all" o vacío se llama al backend sin speciesId (respuesta para todas las especies).
 * @param {string} date - Fecha en Y-m-d
 * @param {number|string|null} speciesId - ID de especie o "all"
 * @returns {{ data: { total_weight_kg: number, calibers: Array }, isLoading: boolean, error: Error|null }}
 */
export function useDailyCalibersBySpecies(date, speciesId) {
  const isAll = speciesId === 'all' || speciesId === '' || speciesId == null;
  const numericSpeciesId =
    !isAll && speciesId !== ''
      ? Number(speciesId)
      : null;
  const enabled = !!date;

  const { data, isLoading, error } = useQuery({
    queryKey: ['raw-material-receptions', 'daily-calibers-by-species', date, isAll ? 'all' : numericSpeciesId],
    queryFn: () =>
      rawMaterialReceptionService.getDailyCalibersBySpecies(
        date,
        isAll ? null : numericSpeciesId
      ),
    enabled,
  });

  return {
    data: data ?? { total_weight_kg: 0, calibers: [] },
    isLoading,
    error: error ?? null,
  };
}
