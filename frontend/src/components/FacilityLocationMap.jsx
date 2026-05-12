import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { roundCoordForForm, parseDraftLatLng } from '../lib/geoFormat';

/** 初期表示・基準枠（東京周辺）。座標のない状態ではこの範囲を表示し、ピンがあれば最遠のピンまで枠が広がります */
const TOKYO_AREA_BOUNDS = [
  [35.52, 139.55],
  [35.82, 139.92],
];

function fitTokyoInitial(map) {
  try {
    map.invalidateSize();
    map.fitBounds(TOKYO_AREA_BOUNDS, { padding: [20, 20], maxZoom: 12 });
  } catch {
    map.setView([35.6812, 139.7671], 11);
  }
}

/**
 * 国土地理院タイル（標準地図）上に登録済み地点と、入力中の候補位置を表示します。
 * @see https://maps.gsi.go.jp/development/ichiran.html
 * @param {{ facilityId: number, name: string, lat?: number | null, lng?: number | null, disabled?: boolean }[]} facilities
 * @param {string} draftLat
 * @param {string} draftLng
 * @param {(lat: string, lng: string) => void} onPickLatLng 地図クリック時（緯度経度を文字列で返す）
 * @param {string} [className]
 */
export default function FacilityLocationMap({
  facilities = [],
  draftLat = '',
  draftLng = '',
  onPickLatLng,
  className = '',
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const pickRef = useRef(onPickLatLng);
  pickRef.current = onPickLatLng;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return undefined;

    const map = L.map(el, {
      scrollWheelZoom: true,
      tap: true,
    });

    L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution:
        '<a href="https://maps.gsi.go.jp/development/ichiran.html" rel="noreferrer noopener">国土地理院タイル（標準地図）</a>',
    }).addTo(map);

    const group = L.layerGroup().addTo(map);
    layerRef.current = group;
    mapRef.current = map;

    const onClick = (e) => {
      const fn = pickRef.current;
      if (fn) {
        fn(roundCoordForForm(e.latlng.lat), roundCoordForForm(e.latlng.lng));
      }
    };
    map.on('click', onClick);

    map.whenReady(() => {
      requestAnimationFrame(() => {
        map.invalidateSize();
      });
    });

    return () => {
      map.off('click', onClick);
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    const bounds = [];

    for (const f of facilities) {
      const la = Number(f.lat);
      const ln = Number(f.lng);
      if (!Number.isFinite(la) || !Number.isFinite(ln)) continue;

      const isOff = Boolean(f.disabled);
      const marker = L.circleMarker([la, ln], {
        radius: isOff ? 6 : 8,
        color: isOff ? '#9ca3af' : '#475569',
        weight: 2,
        fillColor: isOff ? '#d1d5db' : '#64748b',
        fillOpacity: 0.9,
      });
      marker.bindPopup(
        `<strong>${escapeHtml(f.name || '')}</strong><br/>ID ${f.facilityId}${isOff ? '<br/><span style="color:#b45309">無効</span>' : ''}`,
      );
      marker.addTo(layer);
      bounds.push([la, ln]);
    }

    const draft = parseDraftLatLng(draftLat, draftLng);
    if (draft) {
      const draftMarker = L.circleMarker([draft.lat, draft.lng], {
        radius: 11,
        color: '#1d4ed8',
        weight: 2,
        fillColor: '#3b82f6',
        fillOpacity: 0.95,
      });
      draftMarker.bindPopup('<strong>入力中の位置</strong><br/><span style="font-size:11px">フォームの緯度・経度に反映されています</span>');
      draftMarker.addTo(layer);
      bounds.push([draft.lat, draft.lng]);
    }

    if (bounds.length === 0) {
      requestAnimationFrame(() => fitTokyoInitial(map));
      return;
    }

    const latLngBounds = L.latLngBounds(TOKYO_AREA_BOUNDS);
    for (const p of bounds) {
      latLngBounds.extend(p);
    }
    try {
      requestAnimationFrame(() => {
        map.invalidateSize();
        map.fitBounds(latLngBounds, { padding: [24, 24], maxZoom: 16 });
      });
    } catch {
      requestAnimationFrame(() => fitTokyoInitial(map));
    }
  }, [facilities, draftLat, draftLng]);

  return (
    <div
      className={`rounded-lg border border-slate-200 overflow-hidden bg-slate-100 ${className}`}
      style={{ minHeight: 280 }}
    >
      <div ref={containerRef} className="h-[280px] w-full z-0" aria-label="場所の地図" />
    </div>
  );
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
