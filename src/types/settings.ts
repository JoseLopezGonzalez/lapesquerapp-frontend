/**
 * Settings types - tenant configuration from API v2/settings
 */

/** Flat key-value settings (e.g. 'company.name', 'company.mail.host') */
export type SettingsData = Record<string, unknown>;

/** Response from updateSettings on auth error */
export interface UpdateSettingsAuthError {
  success: false;
  authError: true;
}
