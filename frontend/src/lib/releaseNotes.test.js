import { describe, it, expect } from 'vitest';
import { RELEASE_NOTES, getLatestReleaseNoteVersion } from './releaseNotes';

describe('releaseNotes', () => {
  it('keeps latest version in sync with build __APP_VERSION__', () => {
    expect(RELEASE_NOTES.length).toBeGreaterThan(0);
    expect(getLatestReleaseNoteVersion()).toBe(RELEASE_NOTES[0].version);
    expect(RELEASE_NOTES[0].version).toBe(__APP_VERSION__);
  });

  it('each entry has version, date, and items', () => {
    for (const entry of RELEASE_NOTES) {
      expect(entry.version).toMatch(/^\d+\.\d+\.\d+/);
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Array.isArray(entry.items)).toBe(true);
      expect(entry.items.length).toBeGreaterThan(0);
    }
  });
});
