'use client';

import { useQuery } from '@tanstack/react-query';

const DIESEL_API_URL =
  'https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/';

type DieselStation = {
  'Precio Gasoleo A'?: string;
};

type DieselApiResponse = {
  ListaEESSPrecio?: DieselStation[];
  Fecha?: string | null;
};

function parseSpanishDecimal(value: unknown) {
  if (typeof value !== 'string') return null;

  const normalized = value.trim().replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  return parsed;
}

function formatDieselPrice(value: number) {
  return `${value.toFixed(3).replace('.', ',')} €/l`;
}

async function getSpainAverageDieselPrice() {
  const response = await fetch(DIESEL_API_URL, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('No se pudo obtener el precio medio del diésel');
  }

  const data: DieselApiResponse = await response.json();
  const prices = Array.isArray(data?.ListaEESSPrecio)
    ? data.ListaEESSPrecio
        .map((station: DieselStation) => parseSpanishDecimal(station?.['Precio Gasoleo A']))
        .filter((value): value is number => value != null)
    : [];

  if (prices.length === 0) {
    throw new Error('No hay precios de diésel disponibles hoy');
  }

  const average = prices.reduce((sum: number, value: number) => sum + value, 0) / prices.length;

  return {
    value: average,
    label: formatDieselPrice(average),
    sampleCount: prices.length,
    sourceDate: data?.Fecha ?? null,
  };
}

export function useSpainAverageDieselPrice() {
  const query = useQuery({
    queryKey: ['fuel', 'spain-average-diesel'],
    queryFn: getSpainAverageDieselPrice,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    value: query.data?.value ?? null,
    label: query.data?.label ?? null,
    sampleCount: query.data?.sampleCount ?? 0,
    sourceDate: query.data?.sourceDate ?? null,
    isLoading: query.isLoading,
    isUnavailable: query.isError || !query.data?.label,
  };
}
