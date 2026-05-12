/** バックエンドの validateDevicePayload と同条件（6〜24桁の数字） */
export const DEVICE_ID_RE = /^\d{6,24}$/;

const HEADER_SYNONYMS = new Map([
  ['deviceid', 'deviceId'],
  ['デバイスid', 'deviceId'],
  ['デバイスID', 'deviceId'],
  ['facilityid', 'facilityId'],
  ['場所id', 'facilityId'],
  ['場所ID', 'facilityId'],
  ['label', 'label'],
  ['ラベル', 'label'],
  ['facilityname', 'facilityName'],
  ['場所名', 'facilityName'],
]);

/** RFC 4180 風: ダブルクォートで囲み、"" はエスケープ */
export function parseCsvLine(line) {
  const cells = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      cells.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  cells.push(cur);
  return cells;
}

function canonHeader(h) {
  const t = String(h).trim();
  return HEADER_SYNONYMS.get(t) ?? HEADER_SYNONYMS.get(t.toLowerCase()) ?? null;
}

function resolveFacilityName(name, facilities) {
  const n = String(name).trim();
  if (!n) return { error: '場所名が空です' };
  const matches = facilities.filter((f) => String(f.name).trim() === n);
  if (matches.length === 0) {
    return { error: `場所名が一覧にありません: ${n}` };
  }
  if (matches.length > 1) {
    return { error: `場所名が重複しています（マスタを確認）: ${n}` };
  }
  return { facilityId: matches[0].facilityId };
}

/**
 * @param {string} text CSV 全文（UTF-8想定）
 * @param {Array<{ facilityId: number, name: string }>} facilities 場所マスタ（場所名列の解決用）
 * @returns {{ ok: true, items: Array<{deviceId: string, facilityId: number, label: string}> } | { ok: false, errors: Array<{ row: number, msg: string }> }}
 */
export function parseDeviceBulkCsv(text, facilities = []) {
  const raw = String(text).replace(/^\uFEFF/, '');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { ok: false, errors: [{ row: 0, msg: 'ヘッダー行とデータ行が必要です' }] };
  }

  const headerCells = parseCsvLine(lines[0]).map((c) => c.trim());
  const colMap = headerCells.map((h) => canonHeader(h));
  const unknown = headerCells.filter((h, i) => colMap[i] == null);
  if (unknown.length === headerCells.length) {
    return {
      ok: false,
      errors: [
        {
          row: 1,
          msg: `認識できないヘッダーです。次を含めてください: deviceId, facilityId（または場所名）, label（任意）`,
        },
      ],
    };
  }

  const hasDevice = colMap.includes('deviceId');
  const hasFid = colMap.includes('facilityId');
  const hasFname = colMap.includes('facilityName');
  if (!hasDevice) {
    return { ok: false, errors: [{ row: 1, msg: '列「deviceId」（または「デバイスID」）が必要です' }] };
  }
  if (!hasFid && !hasFname) {
    return {
      ok: false,
      errors: [{ row: 1, msg: '列「facilityId」（場所ID）または「場所名」のどちらかが必要です' }],
    };
  }

  /** @type {Array<{ row: number, msg: string }>} */
  const errors = [];
  /** @type {Array<{deviceId: string, facilityId: number, label: string}>} */
  const items = [];
  const seenIds = new Set();

  for (let li = 1; li < lines.length; li += 1) {
    const rowNum = li + 1;
    const cells = parseCsvLine(lines[li]);
    const row = {};
    for (let i = 0; i < colMap.length; i += 1) {
      const field = colMap[i];
      if (!field) continue;
      row[field] = cells[i] !== undefined ? String(cells[i]).trim() : '';
    }

    const deviceId = row.deviceId || '';
    if (!DEVICE_ID_RE.test(deviceId)) {
      errors.push({ row: rowNum, msg: `deviceId は6〜24桁の数字である必要があります: ${deviceId || '（空）'}` });
      continue;
    }
    if (seenIds.has(deviceId)) {
      errors.push({ row: rowNum, msg: `CSV 内で deviceId が重複しています: ${deviceId}` });
      continue;
    }
    seenIds.add(deviceId);

    let facilityIdNum;
    const fidRaw = row.facilityId;
    const fnameRaw = row.facilityName;

    if (hasFname && fnameRaw) {
      const r = resolveFacilityName(fnameRaw, facilities);
      if (r.error) {
        errors.push({ row: rowNum, msg: r.error });
        continue;
      }
      facilityIdNum = Number(r.facilityId);
      if (hasFid && fidRaw && Number(fidRaw) !== facilityIdNum) {
        errors.push({ row: rowNum, msg: `場所IDと場所名が一致しません（行 ${rowNum}）` });
        continue;
      }
    } else {
      if (!fidRaw || !Number.isFinite(Number(fidRaw))) {
        errors.push({ row: rowNum, msg: 'facilityId（場所ID）が不正か、場所名が未入力です' });
        continue;
      }
      facilityIdNum = Number(fidRaw);
    }

    const label =
      row.label != null ? String(row.label).trim().slice(0, 200) : '';

    items.push({ deviceId, facilityId: facilityIdNum, label });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  if (items.length === 0) {
    return { ok: false, errors: [{ row: 0, msg: '有効なデータ行がありません' }] };
  }
  return { ok: true, items };
}

export const DEVICE_BULK_CSV_TEMPLATE = [
  'deviceId,facilityId,label',
  '350976658106130,1,校庭のセンサー',
  '350976658106131,1,',
].join('\n');
