'use strict';

const { deviceLedgerAllowsRelink } = require('../lib/deviceLedgerRelink');

describe('deviceLedgerAllowsRelink', () => {
  it('allows relink when disabled', () => {
    expect(deviceLedgerAllowsRelink({ disabled: true, facilityId: 1 })).toBe(true);
  });

  it('allows relink when facilityId missing', () => {
    expect(deviceLedgerAllowsRelink({ disabled: false })).toBe(true);
    expect(deviceLedgerAllowsRelink({ disabled: false, facilityId: NaN })).toBe(true);
  });

  it('denies relink for active linked device', () => {
    expect(deviceLedgerAllowsRelink({ disabled: false, facilityId: 3 })).toBe(false);
  });
});
