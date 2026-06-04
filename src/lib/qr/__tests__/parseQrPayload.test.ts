import { describe, expect, it } from 'vitest';
import { parseQrPayload } from '../parseQrPayload';

describe('parseQrPayload', () => {
  it('parses semicolon separated key value pairs', () => {
    expect(parseQrPayload('P=123;O=456')).toEqual({ P: '123', O: '456' });
  });

  it('ignores malformed or empty entries', () => {
    expect(parseQrPayload('P=123;NO_VALUE;O=456;=missing-key;B=')).toEqual({
      P: '123',
      O: '456',
    });
  });

  it('normalizes keys and trims values defensively', () => {
    expect(parseQrPayload(' p = 123 ; o = 456 ')).toEqual({ P: '123', O: '456' });
  });
});
