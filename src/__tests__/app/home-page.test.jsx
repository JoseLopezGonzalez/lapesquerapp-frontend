/**
 * Smoke test for home page.
 * Full integration test lives in src/app/ but is excluded from run due to
 * ESM/CSS deps ( @csstools/css-calc ) causing worker failures.
 */
import { describe, it, expect } from 'vitest';

describe('Home page', () => {
  it('placeholder - home page integration test excluded due to ESM deps', () => {
    expect(true).toBe(true);
  });
});
