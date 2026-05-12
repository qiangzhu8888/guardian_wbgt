'use strict';

const { buildQueryPlan } = require('../lib/buildicsQueryPlan');

describe('buildQueryPlan', () => {
  it('chunks by size', () => {
    const now = 1_700_000_000_000;
    const m = Array.from({ length: 5 }, (_, i) => ({
      deviceId: `${100 + i}`,
      facilityId: i,
    }));
    const { chunks } = buildQueryPlan(m, now, 6, 2);
    expect(chunks.length).toBe(3);
  });
});
