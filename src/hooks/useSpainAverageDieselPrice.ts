'use client';

import { useQuery } from '@tanstack/react-query';

const DIESEL_API_URL =
  'https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/';

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

  const data = await response.json();
  const prices = Array.isArray(data?.ListaEESSPrecio)
    ? data.ListaEESSPrecio.map((station) => parseSpanishDecimal(station?.['Precio Gasoleo A'])).filter(Boolean)
    : [];

  if (prices.length === 0) {
    throw new Error('No hay precios de diésel disponibles hoy');
  }

  const average = prices.reduce((sum, value) => sum + value, 0) / prices.length;

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
