'use client';

import { useSession } from 'next-auth/react';
import { useSettingsData } from './useSettingsData';

const REQUIRED_FIELDS: { key: string; label: string }[] = [
  { key: 'company.name', label: 'Nombre de empresa' },
  { key: 'company.cif', label: 'CIF / NIF' },
  { key: 'company.address.street', label: 'Calle (dirección)' },
  { key: 'company.address.city', label: 'Ciudad' },
];

const ALLOWED_ROLES = ['administrador', 'direccion', 'tecnico'];

export function useCompanySetupCheck() {
  const { data: session } = useSession();
  const rawRole = session?.user?.role;
  const primaryRole = Array.isArray(rawRole) ? rawRole[0] : rawRole;
  const isAllowedRole = ALLOWED_ROLES.includes(primaryRole ?? '');

  // useSettingsData.js has a wrong JSDoc (@returns data/isLoading) but actual return is settings/loading
  // useSettingsData.js has a wrong JSDoc (@returns data/isLoading) but actual return is settings/loading
  const { settings, loading } = useSettingsData() as unknown as {
    settings: Record<string, unknown>;
    loading: boolean;
  };

  const missingFields = REQUIRED_FIELDS.filter(({ key }) => {
    const value = settings[key];
    return !value || (typeof value === 'string' && value.trim() === '');
  });

  return {
    isIncomplete: isAllowedRole && missingFields.length > 0,
    missingFields,
    isLoading: loading,
  };
}
