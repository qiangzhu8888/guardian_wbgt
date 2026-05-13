import { DEVICE_ID_RE } from './parseDeviceBulkCsv';

/**
 * QR・バーコード等から読み取った文字列をデバイス ID（6〜24 桁の数字）に正規化する。
 * @param {string} raw
 * @returns {{ ok: true, deviceId: string } | { ok: false, error: string }}
 */
export function extractDeviceIdFromQrText(raw) {
  const s = String(raw ?? '').trim();
  if (!s) {
    return { ok: false, error: '空の内容です。' };
  }
  if (DEVICE_ID_RE.test(s)) {
    return { ok: true, deviceId: s };
  }

  try {
    const j = JSON.parse(s);
    const id = String(j.deviceId ?? j.device_id ?? '').trim();
    if (DEVICE_ID_RE.test(id)) {
      return { ok: true, deviceId: id };
    }
  } catch {
    /* 続行 */
  }

  try {
    const u = new URL(s, typeof window !== 'undefined' ? window.location.origin : 'https://example.invalid');
    const q = u.searchParams.get('deviceId') || u.searchParams.get('device_id');
    if (q) {
      const t = q.trim();
      if (DEVICE_ID_RE.test(t)) {
        return { ok: true, deviceId: t };
      }
    }
    const pathParts = u.pathname.split('/').filter(Boolean);
    const last = pathParts[pathParts.length - 1];
    if (last && DEVICE_ID_RE.test(last)) {
      return { ok: true, deviceId: last };
    }
  } catch {
    /* 続行 */
  }

  const matches = s.match(/\d{6,24}/g);
  if (!matches || matches.length === 0) {
    return {
      ok: false,
      error: 'デバイス ID（6〜24 桁の数字）として読み取れませんでした。',
    };
  }
  const valid = matches.filter((m) => DEVICE_ID_RE.test(m));
  if (valid.length === 1) {
    return { ok: true, deviceId: valid[0] };
  }
  if (valid.length > 1) {
    return {
      ok: false,
      error: '複数の候補が見つかりました。QR にデバイス ID のみを含めるか、JSON の deviceId を指定してください。',
    };
  }
  return {
    ok: false,
    error: 'デバイス ID（6〜24 桁の数字）として読み取れませんでした。',
  };
}
