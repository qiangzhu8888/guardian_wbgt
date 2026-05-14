import { describe, expect, it } from 'vitest';

describe('ProductSlideFigures', () => {
  it('PRODUCT_SLIDE_FIGURE_IDS は 13 枚ぶん一意の id を含む', async () => {
    const { PRODUCT_SLIDE_FIGURE_IDS } = await import('./ProductSlideFigures.jsx');
    expect(PRODUCT_SLIDE_FIGURE_IDS).toHaveLength(13);
    expect(new Set(PRODUCT_SLIDE_FIGURE_IDS).size).toBe(13);
  });
});
