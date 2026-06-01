import { describe, it, expect } from 'vitest';
import { getRedirectUrl, safeRedirectFrom } from '@/utils/loginUtils';

describe('loginUtils', () => {
  it('redirects external users to external stores manager', () => {
    expect(getRedirectUrl({ actorType: 'external_user', role: null }, '')).toBe(
      '/external/stores-manager'
    );
  });

  it('keeps safe from parameter for external users', () => {
    expect(
      getRedirectUrl({ actorType: 'external_user', role: null }, '?from=%2Fexternal%2Fstores%2F10')
    ).toBe('/external/stores/10');
  });

  it('rejects unsafe redirect values', () => {
    expect(safeRedirectFrom('https://evil.test')).toBeNull();
    expect(safeRedirectFrom('//evil.test')).toBeNull();
  });
});
