import { describe, it, expect } from 'vitest';
import {
  parseCsvLine,
  parseDeviceBulkCsv,
  DEVICE_ID_RE,
  DEVICE_BULK_CSV_TEMPLATE,
} from './parseDeviceBulkCsv';

describe('parseCsvLine', () => {
  it('splits simple commas', () => {
    expect(parseCsvLine('a,b,c')).toEqual(['a', 'b', 'c']);
  });
  it('handles quotes and escaped quotes', () => {
    expect(parseCsvLine('"a,b",c')).toEqual(['a,b', 'c']);
    expect(parseCsvLine('"say ""hi""",2')).toEqual(['say "hi"', '2']);
  });
});

describe('DEVICE_ID_RE', () => {
  it('matches backend rule', () => {
    expect(DEVICE_ID_RE.test('123456')).toBe(true);
    expect(DEVICE_ID_RE.test('12345')).toBe(false);
    expect(DEVICE_ID_RE.test('a123456')).toBe(false);
  });
});

describe('parseDeviceBulkCsv', () => {
  const facilities = [
    { facilityId: 1, name: '北里小学校' },
    { facilityId: 2, name: '第二体育館' },
  ];

  it('parses English headers', () => {
    const csv = 'deviceId,facilityId,label\n350976658106130,1,hello\n350976658106131,2,';
    const r = parseDeviceBulkCsv(csv, facilities);
    expect(r.ok).toBe(true);
    expect(r.items).toHaveLength(2);
    expect(r.items[0]).toEqual({ deviceId: '350976658106130', facilityId: 1, label: 'hello' });
  });

  it('parses Japanese headers and 場所名', () => {
    const csv = 'デバイスID,場所名,ラベル\n350976658106130,北里小学校,テスト';
    const r = parseDeviceBulkCsv(csv, facilities);
    expect(r.ok).toBe(true);
    expect(r.items[0].facilityId).toBe(1);
  });

  it('rejects duplicate deviceId in file', () => {
    const csv = 'deviceId,facilityId\n350976658106130,1\n350976658106130,2';
    const r = parseDeviceBulkCsv(csv, facilities);
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.msg.includes('重複'))).toBe(true);
  });

  it('template constant is parseable', () => {
    const r = parseDeviceBulkCsv(DEVICE_BULK_CSV_TEMPLATE, [
      { facilityId: 1, name: 'x' },
    ]);
    expect(r.ok).toBe(true);
  });
});
