'use strict';

/**
 * AUTH_BOOTSTRAP_SECRET の .env / コンソール貼り付け由来の揺れを除去（比較用一式）。
 * 機密値はログに出さないこと。
 *
 * - UTF-8 BOM
 * - 値に誤って含めた `AUTH_BOOTSTRAP_SECRET=` 接頭辞（連続も除去）
 * - 外側の引用符（入れ子も数回まで）
 */
function normalizeAuthBootstrapSecret(raw) {
  let s = String(raw || '').replace(/^\uFEFF/, '').trim();
  while (/^AUTH_BOOTSTRAP_SECRET\s*=\s*/i.test(s)) {
    s = s.replace(/^AUTH_BOOTSTRAP_SECRET\s*=\s*/i, '').trim();
  }
  for (let i = 0; i < 4; i += 1) {
    const inner = s.replace(/^["']+|["']+$/g, '').trim();
    if (inner === s) break;
    s = inner;
  }
  while (/^AUTH_BOOTSTRAP_SECRET\s*=\s*/i.test(s)) {
    s = s.replace(/^AUTH_BOOTSTRAP_SECRET\s*=\s*/i, '').trim();
  }
  return s;
}

module.exports = { normalizeAuthBootstrapSecret };
