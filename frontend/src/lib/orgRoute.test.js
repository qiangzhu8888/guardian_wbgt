import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  publicConfigQueryString,
  normalizeOrgSlugParam,
  monitorHomePath,
  publicOrgDashboardAbsoluteUrl,
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
    expect(monitorHomePath('school-a')).toBe('/tenant/school-a');
    expect(monitorHomePath()).toBe('/tenant/acme');
    expect(monitorHomePath(undefined)).toBe('/tenant/acme');
  });

  it('publicOrgDashboardAbsoluteUrl uses VITE_PUBLIC_APP_ORIGIN and strips trailing slash', () => {
    vi.stubEnv('VITE_PUBLIC_APP_ORIGIN', 'https://monitor.example.jp/');
    expect(publicOrgDashboardAbsoluteUrl('techsor')).toBe('https://monitor.example.jp/tenant/techsor');
  });
});
