import { useState, useEffect, useCallback } from 'react';
import { buildPublicConfigUrls } from '../lib/publicApi';
import { normalizeOrgSlugParam } from '../lib/orgRoute';

/**
 * @param {string | undefined} orgSlug URL の :orgSlug（未指定時はデフォルトスラッグ）
 */
async function fetchConfig(orgSlug) {
  const urls = buildPublicConfigUrls(orgSlug);

  let lastErr;
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(String(res.status));
      return await res.json();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('config load failed');
}

/**
 * @param {string | undefined} orgSlug `/tenant/:orgSlug` の値
 * @returns {{ config: object | null, loading: boolean, error: string | null, reload: () => Promise<void> }}
 */
export function usePublicConfig(orgSlug) {
  const slug = normalizeOrgSlugParam(orgSlug);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const c = await fetchConfig(slug);
      setConfig(c);
    } catch (e) {
      console.error(e);
      setError('設定の読み込みに失敗しました');
      setConfig(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { config, loading, error, reload };
}
