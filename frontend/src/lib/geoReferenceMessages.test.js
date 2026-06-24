import { describe, it, expect } from 'vitest';
import { describeFacilityCoordsIssue, formatPublicApiError } from './geoReferenceMessages.js';

describe('geoReferenceMessages', () => {
  it('describeFacilityCoordsIssue detects 0,0', () => {
    const r = describeFacilityCoordsIssue(0, 0);
    expect(r.kind).toBe('unset_zero');
    expect(r.title).toContain('0,0');
  });

  it('describeFacilityCoordsIssue detects missing', () => {
    expect(describeFacilityCoordsIssue('', null).kind).toBe('missing');
  });

  it('describeFacilityCoordsIssue ok for Tokyo', () => {
    expect(describeFacilityCoordsIssue(35.68, 139.76).kind).toBe('ok');
  });

  it('formatPublicApiError maps 503 and 502 jwa', () => {
    expect(formatPublicApiError(503, '', 'jwa')).toContain('未設定');
    expect(formatPublicApiError(502, 'timeout', 'jwa')).toContain('JWA');
  });
});
