import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyColorScheme,
  COLOR_SCHEME_STORAGE_KEY,
  getStoredOverride,
  toggleColorScheme,
} from './themeInit';

function mockMatchMedia(isDark) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: query === '(prefers-color-scheme: dark)' ? isDark : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe('themeInit', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('override が無いとき OS がライトなら dark を付けない', () => {
    mockMatchMedia(false);
    applyColorScheme();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('override が無いとき OS がダークなら dark を付ける', () => {
    mockMatchMedia(true);
    applyColorScheme();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('localStorage に light があれば OS がダークでも dark にしない', () => {
    mockMatchMedia(true);
    localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, 'light');
    applyColorScheme();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('toggleColorScheme で dark が切り替わり override が保存される', () => {
    mockMatchMedia(false);
    applyColorScheme();
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    toggleColorScheme();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(getStoredOverride()).toBe('dark');

    toggleColorScheme();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(getStoredOverride()).toBe('light');
  });
});
