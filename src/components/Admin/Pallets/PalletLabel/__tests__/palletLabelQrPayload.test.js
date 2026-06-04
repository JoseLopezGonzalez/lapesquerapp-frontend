import { describe, expect, it } from 'vitest';
import { buildPalletQrPayload } from '@/lib/qr/buildPalletQrPayload';

describe('buildPalletQrPayload', () => {
  it('builds pallet and order payload', () => {
    expect(buildPalletQrPayload({ id: 123, orderId: 456 })).toBe('P=123;O=456');
  });

  it('uses nested order id as fallback', () => {
    expect(buildPalletQrPayload({ id: 123, order: { id: 456 } })).toBe('P=123;O=456');
  });

  it('builds pallet-only payload when order is absent', () => {
    expect(buildPalletQrPayload({ id: 123 })).toBe('P=123');
  });

  it('returns empty payload without pallet id', () => {
    expect(buildPalletQrPayload({ orderId: 456 })).toBe('');
  });
});
