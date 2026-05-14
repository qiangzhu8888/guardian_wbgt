'use strict';

/**
 * 気象庁「熱中症警戒アラート」（データ種別 VPFT50）の Atom フィード参照
 * @see https://www.data.jma.go.jp/developer/xml/feed/extra.xml
 * @see 気象庁情報カタログ「熱中症警戒アラート」（Netsu-Alert）
 *
 * 注意: 気象庁が JWA のような緯度経度 1 点の WBGT 予測 JSON は一般公開していません。
 * 本モジュールは「発表があるか／該当都道府県が本文に含まれるか」を返す参考用です。
 */

const JMA_EXTRA_ATOM = 'https://www.data.jma.go.jp/developer/xml/feed/extra.xml';
const GSI_REVERSE = 'https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress';

/** @type {Record<string, string>} JIS 市区町村コード先頭2桁（01–47）→都道府県名 */
const PREF_NAME_BY_CODE = Object.freeze({
  '01': '北海道',
  '02': '青森県',
  '03': '岩手県',
  '04': '宮城県',
  '05': '秋田県',
  '06': '山形県',
  '07': '福島県',
  '08': '茨城県',
  '09': '栃木県',
  '10': '群馬県',
  '11': '埼玉県',
  '12': '千葉県',
  '13': '東京都',
  '14': '神奈川県',
  '15': '新潟県',
  '16': '富山県',
  '17': '石川県',
  '18': '福井県',
  '19': '山梨県',
  '20': '長野県',
  '21': '岐阜県',
  '22': '静岡県',
  '23': '愛知県',
  '24': '三重県',
  '25': '滋賀県',
  '26': '京都府',
  '27': '大阪府',
  '28': '兵庫県',
  '29': '奈良県',
  '30': '和歌山県',
  '31': '鳥取県',
  '32': '島根県',
  '33': '岡山県',
  '34': '広島県',
  '35': '山口県',
  '36': '徳島県',
  '37': '香川県',
  '38': '愛媛県',
  '39': '高知県',
  '40': '福岡県',
  '41': '佐賀県',
  '42': '長崎県',
  '43': '熊本県',
  '44': '大分県',
  '45': '宮崎県',
  '46': '鹿児島県',
  '47': '沖縄県',
});

/**
 * @param {Record<string, unknown>} q Express req.query
 * @returns {{ lat: number, lng: number } | null}
 */
function parseLatLonQuery(q) {
  const lat = Number(q.lat);
  const lng = Number(q.lon != null ? q.lon : q.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

/**
 * @param {string} muniCd 5桁程度の市区町村コード（例: 13101）
 * @returns {string | null}
 */
function prefectureNameFromMuniCd(muniCd) {
  const s = String(muniCd || '').trim();
  if (s.length < 2) return null;
  const code = s.slice(0, 2);
  return PREF_NAME_BY_CODE[code] || null;
}

/**
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<{ muniCd: string, prefName: string } | { error: string }>}
 */
async function reverseGeocodePrefecture(lat, lng) {
  const url = `${GSI_REVERSE}?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}`;
  let res;
  try {
    res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'WBGT-Monitor-JMA-Advisory/1.0 (gsi reverse-geocoder)',
      },
      signal: AbortSignal.timeout(12000),
    });
  } catch (e) {
    return { error: '逆ジオコーディングに接続できませんでした' };
  }
  if (!res.ok) return { error: `逆ジオコーディングが応答しませんでした (${res.status})` };
  let json;
  try {
    json = await res.json();
  } catch {
    return { error: '逆ジオコーディングの結果を読み取れませんでした' };
  }
  const muniCd = json && json.results && json.results.muniCd != null ? String(json.results.muniCd).trim() : '';
  if (!muniCd) return { error: '地域コードを取得できませんでした（日本国外の可能性があります）' };
  const prefName = prefectureNameFromMuniCd(muniCd);
  if (!prefName) return { error: '都道府県を判定できませんでした' };
  return { muniCd, prefName };
}

/**
 * @param {string} xml
 * @returns {Array<{ href: string, title: string, updated: string, contentText: string }>}
 */
function parseAtomEntries(xml) {
  const entries = [];
  const reEntry = /<entry>([\s\S]*?)<\/entry>/gi;
  let m;
  while ((m = reEntry.exec(xml))) {
    const block = m[1];
    const hrefM = /<link[^>]+href="([^"]+)"[^>]*\/?>/.exec(block);
    const titleM = /<title>([^<]*)<\/title>/.exec(block);
    const updatedM = /<updated>([^<]*)<\/updated>/.exec(block);
    const contentM = /<content[^>]*>([\s\S]*?)<\/content>/.exec(block);
    let contentText = '';
    if (contentM) {
      contentText = contentM[1]
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    const href = hrefM ? hrefM[1].trim() : '';
    if (!href) continue;
    entries.push({
      href,
      title: titleM ? titleM[1].trim() : '',
      updated: updatedM ? updatedM[1].trim() : '',
      contentText,
    });
  }
  return entries;
}

function isVpft50Href(href) {
  return /\/[^/]*_VPFT50_[^/]+\.xml$/i.test(href) || href.toUpperCase().includes('_VPFT50_');
}

/**
 * @param {string} text
 * @param {string} prefName 例: 東京都
 */
function textMentionsPrefecture(text, prefName) {
  if (!text || !prefName) return false;
  if (text.includes(prefName)) return true;
  const short = prefName.replace(/[都道府県]$/, '');
  if (short.length >= 2 && text.includes(short)) return true;
  return false;
}

function stripXmlToText(xml) {
  return xml
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @param {string} feedXml
 * @param {string} prefName
 */
function pickVpft50EntryForPrefecture(feedXml, prefName) {
  const entries = parseAtomEntries(feedXml);
  const vpft = entries.filter((e) => isVpft50Href(e.href));
  for (const e of vpft) {
    if (textMentionsPrefecture(e.contentText, prefName)) {
      return { entry: e, matchedIn: 'atom' };
    }
  }
  return { entry: vpft[0] || null, matchedIn: null };
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/xml, text/xml, application/atom+xml, */*',
      'User-Agent': 'WBGT-Monitor-JMA-Advisory/1.0 (jma developer xml)',
    },
    signal: AbortSignal.timeout(20000),
  });
  const text = await res.text();
  if (!res.ok) {
    const e = new Error(`HTTP ${res.status}`);
    e.status = res.status;
    throw e;
  }
  return text;
}

/**
 * @param {string} feedXml Atom フィード全文
 * @param {string} prefName 都道府県名
 * @param {string} muniCd
 * @param {Map<string, string> | null} [detailCache] VPFT50 XML を URL 単位で共有（バッチ用）
 */
async function resolveHeatAdvisoryFromFeedXml(feedXml, prefName, muniCd, detailCache) {
  const { entry, matchedIn } = pickVpft50EntryForPrefecture(feedXml, prefName);

  if (!entry) {
    return {
      active: false,
      prefName,
      muniCd,
      headline: null,
      detail: null,
      advisoryXmlUrl: null,
      reason: 'no_vpft50_in_feed',
      feedUrl: JMA_EXTRA_ATOM,
      note:
        '現在の随時フィードに熱中症警戒アラート（VPFT50）の電文がありません（未発表またはシーズン外の場合があります）。',
    };
  }

  let detailText = entry.contentText || '';
  let matched = matchedIn === 'atom';

  if (!matched && entry.href) {
    try {
      let flat = '';
      if (detailCache && detailCache.has(entry.href)) {
        flat = detailCache.get(entry.href);
      } else {
        const body = await fetchText(entry.href);
        flat = stripXmlToText(body);
        if (detailCache) detailCache.set(entry.href, flat);
      }
      matched = textMentionsPrefecture(flat, prefName);
      if (matched && flat.length > 0) {
        detailText = flat.slice(0, 2000);
      } else if (!detailText && flat.length > 0) {
        detailText = flat.slice(0, 2000);
      }
    } catch {
      /* ignore */
    }
  }

  if (!matched) {
    return {
      active: false,
      prefName,
      muniCd,
      headline: entry.title || null,
      detail: detailText || null,
      advisoryXmlUrl: entry.href,
      reason: 'vpft50_exists_but_pref_not_in_body',
      feedUrl: JMA_EXTRA_ATOM,
      note: '熱中症警戒アラート電文はありますが、この地点の都道府県を本文から特定できませんでした（広域表現のみの場合があります）。',
    };
  }

  return {
    active: true,
    prefName,
    muniCd,
    headline: entry.title || '熱中症警戒アラート',
    detail: detailText || null,
    advisoryXmlUrl: entry.href,
    updated: entry.updated || null,
    feedUrl: JMA_EXTRA_ATOM,
    note: '日最高暑さ指数（WBGT）が 33℃ 以上になることが予想される場合に発表される情報です（気象庁）。詳細はリンク先 XML・官報をご確認ください。',
  };
}

/**
 * 施設座標に対し、該当都道府県の熱中症警戒アラート有無（Atom 本文または VPFT50 XML 全文から判定）
 */
async function fetchHeatAdvisoryForPoint(lat, lng) {
  const geo = await reverseGeocodePrefecture(lat, lng);
  if ('error' in geo) {
    const e = new Error(geo.error);
    e.code = 'geocode_failed';
    throw e;
  }
  const { prefName, muniCd } = geo;

  let feedXml;
  try {
    feedXml = await fetchText(JMA_EXTRA_ATOM);
  } catch (err) {
    const e = new Error('気象庁フィードの取得に失敗しました');
    e.code = 'feed_failed';
    e.cause = err;
    throw e;
  }

  return resolveHeatAdvisoryFromFeedXml(feedXml, prefName, muniCd, null);
}

const BATCH_MAX = 24;

/**
 * 複数地点をまとめて解決（気象庁フィードは1回、VPFT50 本文は URL 単位でキャッシュ）
 * @param {Array<{ id: string | number, lat: number, lng: number }>} items
 * @returns {Promise<Array<Record<string, unknown>>>}
 */
async function fetchHeatAdvisoryBatch(items) {
  let feedXml;
  try {
    feedXml = await fetchText(JMA_EXTRA_ATOM);
  } catch (err) {
    const e = new Error('気象庁フィードの取得に失敗しました');
    e.code = 'feed_failed';
    e.cause = err;
    throw e;
  }

  const detailCache = new Map();
  /** @type {Array<Record<string, unknown>>} */
  const out = [];

  for (const it of items) {
    const id = it.id;
    const geo = await reverseGeocodePrefecture(it.lat, it.lng);
    if ('error' in geo) {
      out.push({ id, ok: false, code: 'geocode_failed', msg: geo.error });
      continue;
    }
    const payload = await resolveHeatAdvisoryFromFeedXml(feedXml, geo.prefName, geo.muniCd, detailCache);
    out.push({ id, ok: true, ...payload });
  }

  return out;
}

module.exports = {
  JMA_EXTRA_ATOM,
  GSI_REVERSE,
  BATCH_MAX,
  PREF_NAME_BY_CODE,
  parseLatLonQuery,
  prefectureNameFromMuniCd,
  reverseGeocodePrefecture,
  parseAtomEntries,
  isVpft50Href,
  textMentionsPrefecture,
  pickVpft50EntryForPrefecture,
  resolveHeatAdvisoryFromFeedXml,
  fetchHeatAdvisoryForPoint,
  fetchHeatAdvisoryBatch,
};
