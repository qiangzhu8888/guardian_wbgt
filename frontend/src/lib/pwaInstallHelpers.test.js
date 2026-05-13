import { describe, expect, it } from 'vitest';
import {
  isIosUserAgent,
  PWA_INSTALL_DISMISS_UNTIL_KEY,
  readDismissUntilMs,
  writeDismissUntilMs,
} from './pwaInstallHelpers';

describe('pwaInstallHelpers', () => {
  it('isIosUserAgent: iPhone・iPod・旧 iPad は true', () => {
    expect(
      isIosUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      ),
    ).toBe(true);
    expect(
      isIosUserAgent(
        'Mozilla/5.0 (iPod touch; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15',
      ),
    ).toBe(true);
    expect(isIosUserAgent('Mozilla/5.0 (iPad; CPU OS 16_2 like Mac OS X)')).toBe(true);
    expect(isIosUserAgent(undefined)).toBe(false);
    expect(isIosUserAgent('')).toBe(false);
  });

  it('isIosUserAgent: Android・一般的なデスクトップは false（Macintosh単体も false）', () => {
    expect(
      isIosUserAgent(
        'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile',
      ),
    ).toBe(false);
    expect(
      isIosUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0',
      ),
    ).toBe(false);
  });

  it('readDismissUntilMs / writeDismissUntilMs: 期限内は値を返し、過去なら null', () => {
    const future = Date.now() + 60_000;
    writeDismissUntilMs(future);
    expect(readDismissUntilMs()).toBe(future);

    window.localStorage.setItem(PWA_INSTALL_DISMISS_UNTIL_KEY, String(Date.now() - 1000));
    expect(readDismissUntilMs()).toBe(null);
    window.localStorage.removeItem(PWA_INSTALL_DISMISS_UNTIL_KEY);
  });
});
