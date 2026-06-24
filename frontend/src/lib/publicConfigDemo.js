/**
 * 公開 config がすべて isMock 施設のみ（静的フォールバック等）か
 * @param {Array<{ isMock?: boolean }> | undefined} mockFacilities
 */
export function isDemoOnlyPublicConfig(mockFacilities) {
  const list = mockFacilities || [];
  return list.length > 0 && list.every((f) => f.isMock === true);
}
