import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  publicConfigQueryString,
  normalizeOrgSlugParam,
  monitorHomePath,
} from './orgRoute';

describe('orgRoute', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_DEFAULT_ORG_SLUG', 'acme');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('normalizeOrgSlugParam lowercases and falls back', () => {
    expect(normalizeOrgSlugParam('')).toBe('acme');
    expect(normalizeOrgSlugParam('  Foo-Bar ')).toBe('foo-bar');
  });

  it('publicConfigQueryString encodes slug', () => {
    expect(publicConfigQueryString('school-a')).toBe('orgSlug=school-a');
  });

  it('monitorHomePath', () => {
    expect(monitorHomePath('school-a')).toBe('/o/school-a');
  });
});
