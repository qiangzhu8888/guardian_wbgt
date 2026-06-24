import { describe, it, expect } from 'vitest';
import {
  parseGatewayBatteryPercent,
  gatewayRowMatchesDeviceId,
  findGatewayBatteryPercentForDevice,
  buildGatewayBatteryByDeviceId,
  buildApGatewayStatusBody,
} from './gatewayBattery.js';

describe('gatewayBattery', () => {
  it('parseGatewayBatteryPercent rejects -1 and accepts 0-100', () => {
    expect(parseGatewayBatteryPercent(-1)).toBeNull();
    expect(parseGatewayBatteryPercent(60)).toBe(60);
    expect(parseGatewayBatteryPercent(60.4)).toBe(60);
    expect(parseGatewayBatteryPercent(101)).toBeNull();
  });

  it('gatewayRowMatchesDeviceId by imei/mac digits', () => {
    const row = { imei: '351034927572622', mac: '351034927572622', battery: 60 };
    expect(gatewayRowMatchesDeviceId(row, '351034927572622')).toBe(true);
    expect(gatewayRowMatchesDeviceId(row, '999')).toBe(false);
  });

  it('findGatewayBatteryPercentForDevice returns percent', () => {
    const list = [
      { imei: '111', battery: -1, onlineStatus: 0 },
      { imei: '351034927572622', battery: 60, onlineStatus: 1 },
    ];
    expect(findGatewayBatteryPercentForDevice(list, '351034927572622')).toBe(60);
    expect(findGatewayBatteryPercentForDevice(list, '111')).toBeNull();
  });

  it('buildGatewayBatteryByDeviceId maps device ids', () => {
    const list = [{ imei: '222', battery: 45 }];
    const map = buildGatewayBatteryByDeviceId(list, ['222', '333']);
    expect(map.get('222')).toBe(45);
    expect(map.has('333')).toBe(false);
  });

  it('buildApGatewayStatusBody uses window hours', () => {
    const now = 1_000_000_000_000;
    expect(buildApGatewayStatusBody(now, 24)).toEqual({
      startTime: now - 24 * 60 * 60 * 1000,
      endTime: now,
    });
  });
});
