import { getSettings } from "@/services/settingsService";

let cachedSettings = null;

export async function getSettingValue(key, forceRefresh = false) {
  if (!cachedSettings || forceRefresh) {
    cachedSettings = await getSettings();
  }
  return cachedSettings?.[key];
}

export function invalidateSettingsCache() {
  cachedSettings = null;
} 