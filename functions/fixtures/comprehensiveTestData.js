'use strict';

const { validateFacilityPayload } = require('../lib/facilityValidation');
const { validateDevicePayload } = require('../lib/buildicsProxyRules');

/** 既定テナント（/tenant/default） */
const DEFAULT_ORG_ID = 'default';

/** 第2テナント（/tenant/acme・マルチテナント検証用） */
const ACME_ORG_ID = 'acme-test';

/**
 * Firestore `orgs` へ投入するフィールド（機密は含めない）
 * @type {Array<Record<string, unknown>>}
 */
const orgs = [
  {
    _docId: DEFAULT_ORG_ID,
    slug: 'default',
    name: 'テスト・既定組織（網羅フィクスチャ）',
    disabled: false,
    dashboardTitle: '[Fixture] 熱中症監視デモ',
    dashboardSubtitle: 'Firestore フィクスチャ seed-test-data / 全レベル・複数デバイス・他テナントあり',
    themePrimary: '#0f172a',
    createdAt: 1,
    updatedAt: 1,
  },
  {
    _docId: ACME_ORG_ID,
    slug: 'acme',
    name: 'Fixture Acme 株式会社',
    disabled: false,
    dashboardTitle: 'Acme テナント（Fixture）',
    dashboardSubtitle: 'マルチテナント分離の確認用',
    themePrimary: '#14532d',
    createdAt: 1,
    updatedAt: 1,
  },
];

/**
 * `facilities` コレクション（ドキュメント ID = facilityId）
 * @type {Array<Record<string, unknown>>}
 */
const facilities = [
  {
    facilityId: 1,
    orgId: DEFAULT_ORG_ID,
    name: '北里小学校グランド（屋外・代表）',
    sortOrder: 10,
    placementType: 'outdoor',
    venueCategory: 'school',
    address: '東京都港区北里 1-1',
    lat: 35.652,
    lng: 139.732,
    disabled: false,
  },
  {
    facilityId: 2,
    orgId: DEFAULT_ORG_ID,
    name: '北里保育園',
    sortOrder: 20,
    placementType: 'outdoor',
    venueCategory: 'childcare',
    address: '東京都港区北里 2-4',
    lat: 35.651,
    lng: 139.729,
    disabled: false,
  },
  {
    facilityId: 3,
    orgId: DEFAULT_ORG_ID,
    name: '休止施設（disabled・台帳検証）',
    sortOrder: 5,
    venueCategory: 'other',
    address: '',
    lat: null,
    lng: null,
    disabled: true,
  },
  {
    facilityId: 4,
    orgId: DEFAULT_ORG_ID,
    name: '北門付近・暫定観測点',
    sortOrder: 15,
    placementType: 'semi_outdoor',
    venueCategory: 'construction_site',
    address: '北門前広場',
    lat: 35.6505,
    lng: 139.734,
    disabled: false,
  },
  {
    facilityId: 5,
    orgId: DEFAULT_ORG_ID,
    name: '北里小学校体育館（屋内・住所のみ）',
    sortOrder: 25,
    placementType: 'indoor',
    venueCategory: 'gym_stadium',
    address: '屋内競技場エリア',
    lat: null,
    lng: null,
    disabled: false,
  },
  {
    facilityId: 6,
    orgId: DEFAULT_ORG_ID,
    name: 'くじら保育園',
    sortOrder: 30,
    venueCategory: 'childcare',
    address: '',
    lat: null,
    lng: null,
    disabled: false,
  },
  {
    facilityId: 101,
    orgId: ACME_ORG_ID,
    name: 'Acme 本社屋上',
    sortOrder: 1,
    placementType: 'outdoor',
    venueCategory: 'office',
    address: '大阪府大阪市北区 1-2-3',
    lat: 34.702,
    lng: 135.495,
    disabled: false,
  },
  {
    facilityId: 102,
    orgId: ACME_ORG_ID,
    name: 'Acme 倉庫棟',
    sortOrder: 2,
    venueCategory: 'warehouse',
    address: '',
    lat: null,
    lng: null,
    disabled: false,
  },
];

/**
 * `devices` コレクション（ドキュメント ID = deviceId 文字列）
 * 値は BUILDICS 向け文字列として数字のみ（架空 ID）
 * @type {Array<Record<string, unknown>>}
 */
const devices = [
  {
    deviceId: '350976658106130',
    orgId: DEFAULT_ORG_ID,
    facilityId: 1,
    label: 'グランド メイン-GATE',
    disabled: false,
  },
  {
    deviceId: '350976658106131',
    orgId: DEFAULT_ORG_ID,
    facilityId: 2,
    label: '保育園 園庭センサー',
    disabled: false,
  },
  {
    deviceId: '350976658106132',
    orgId: DEFAULT_ORG_ID,
    facilityId: 4,
    label: '北門付近センサー',
    disabled: false,
  },
  {
    deviceId: '350976658106133',
    orgId: DEFAULT_ORG_ID,
    facilityId: 5,
    label: '体育館 吹き抜け',
    disabled: false,
  },
  {
    deviceId: '350976658106134',
    orgId: DEFAULT_ORG_ID,
    facilityId: 6,
    label: 'くじら園 玄関',
    disabled: false,
  },
  {
    deviceId: '350976658106199',
    orgId: DEFAULT_ORG_ID,
    facilityId: 1,
    label: 'レガシー端末（無効・監視対象外）',
    disabled: true,
  },
  {
    deviceId: '350976659000101',
    orgId: ACME_ORG_ID,
    facilityId: 101,
    label: 'Acme 屋上 UNIT-A',
    disabled: false,
  },
  {
    deviceId: '350976659000102',
    orgId: ACME_ORG_ID,
    facilityId: 102,
    label: 'Acme 倉庫 B-1',
    disabled: false,
  },
];

function getComprehensiveTestData() {
  return { orgs, facilities, devices };
}

/**
 * @returns {string[]} 問題がなければ空配列
 */
function validateComprehensiveTestData() {
  const errors = [];
  const slugSet = new Set();
  for (const o of orgs) {
    const id = o._docId;
    if (!id) errors.push('org _docId がありません');
    const slug = String(o.slug || '');
    if (slugSet.has(slug)) errors.push(`重複 slug: ${slug}`);
    slugSet.add(slug);
  }

  const facByOrg = new Map();
  for (const f of facilities) {
    const fid = f.facilityId;
    const oid = f.orgId;
    const v = validateFacilityPayload(
      fid,
      f.name,
      f.sortOrder,
      f.address,
      f.lat,
      f.lng,
      f.placementType,
      f.venueCategory,
    );
    if (v) errors.push(`施設 ${fid}: ${v}`);
    if (!orgs.some((o) => o._docId === oid)) errors.push(`施設 ${fid}: 不明な orgId ${oid}`);
    if (!facByOrg.has(oid)) facByOrg.set(oid, new Map());
    facByOrg.get(oid).set(fid, f);
  }

  for (const d of devices) {
    const oid = d.orgId;
    const fid = d.facilityId;
    const err = validateDevicePayload(d.deviceId, fid, d.label);
    if (err) errors.push(`デバイス ${d.deviceId}: ${err}`);
    const fam = facByOrg.get(oid);
    const fc = fam && fam.get(fid);
    if (!fc) errors.push(`デバイス ${d.deviceId}: 施設 ${fid} が org ${oid} にありません`);
    else if (!d.disabled && fc.disabled === true) {
      errors.push(`デバイス ${d.deviceId}: 有効デバイスが disabled 施設 ${fid} を参照`);
    }
  }

  return errors;
}

module.exports = {
  DEFAULT_ORG_ID,
  ACME_ORG_ID,
  orgs,
  facilities,
  devices,
  getComprehensiveTestData,
  validateComprehensiveTestData,
};
