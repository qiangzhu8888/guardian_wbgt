'use strict';

const { shouldSendDedup } = require('../lib/heatAlertDedup');

describe('heatAlertDedup.shouldSendDedup', () => {
  const cooldownMs = 60 * 45 * 1000;

  it('未定義状態で初送信', () => {
    expect(shouldSendDedup(undefined, '厳重警戒', cooldownMs).send).toBe(true);
  });

  it('ランク変わらずにクールダウン中は送信しない', () => {
    const prev = { rank: 1, ts: Date.now() }; // ts 直近なので連続送信を抑止
    expect(shouldSendDedup(prev, '厳重警戒', cooldownMs).send).toBe(false);
  });

  it('環境が悪化したら送信', () => {
    const stale = Date.now() - cooldownMs - 1000;
    const prev = { rank: 1, ts: stale };
    /** 危険(0) < 厳重警戒(1) */
    expect(shouldSendDedup(prev, '危険', cooldownMs).send).toBe(true);
  });
});
