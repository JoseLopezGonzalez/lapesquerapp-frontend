'use client';

import React, { createContext, useContext } from 'react';
import { useSettingsData } from '@/hooks/useSettingsData';

const SettingsContext = createContext();

/**
 * SettingsProvider - provides tenant settings via React Query.
 * Consumidores: AdminLayoutClient, SideBar, OrderMap, SettingsForm
 */
export function SettingsProvider({ children }) {
  const { settings, loading, setSettings } = useSettingsData();

  return (
    <SettingsContext.Provider value={{ settings, loading, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
