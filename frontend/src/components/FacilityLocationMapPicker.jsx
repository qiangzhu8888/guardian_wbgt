import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatLatLngInput, parseOptionalLatLng } from '../lib/facilityMapLatLng';

/** 初期表示（東京駅付近） */
const DEFAULT_CENTER = /** @type {const} */ ([35.681236, 139.767125]);
const DEFAULT_ZOOM = 14;

// Vite でもデフォルトのマーカー画像が読み込めるようにする
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

/**
 * 緯度経度の指定支援（OpenStreetMap）。クリックまたはピンのドラッグで座標を更新。
 * @param {{
 *   latStr: string,
 *   lngStr: string,
 *   onPick: (lat: string, lng: string) => void,
 * }} props
 */
export default function FacilityLocationMapPicker({ latStr, lngStr, onPick }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const skipNextPropSync = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const map = L.map(el).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>（表示のみ・APIキー不要）',
    }).addTo(map);

    const initial = parseOptionalLatLng(latStr, lngStr);
    const start = initial ? [initial.lat, initial.lng] : DEFAULT_CENTER;
    const marker = L.marker(start, { draggable: true }).addTo(map);
    if (initial) {
      map.setView(start, DEFAULT_ZOOM);
    }

    const emitFromLatLng = (latlng) => {
      const formatted = formatLatLngInput(latlng.lat, latlng.lng);
      skipNextPropSync.current = true;
      onPick(formatted.lat, formatted.lng);
    };

    marker.on('dragend', () => {
      emitFromLatLng(marker.getLatLng());
    });

    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      emitFromLatLng(e.latlng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const marker = markerRef.current;
    const map = mapRef.current;
    if (!marker || !map) return;

    if (skipNextPropSync.current) {
      skipNextPropSync.current = false;
      return;
    }

    const p = parseOptionalLatLng(latStr, lngStr);
    if (p) {
      const ll = L.latLng(p.lat, p.lng);
      marker.setLatLng(ll);
      map.setView(ll, Math.max(map.getZoom(), 15), { animate: false });
    }
  }, [latStr, lngStr]);

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-slate-500 leading-relaxed">
        地図を<strong className="font-medium text-slate-700">クリック</strong>するか、
        <strong className="font-medium text-slate-700">ピンをドラッグ</strong>して位置を合わせると、上の緯度・経度に反映されます。
      </p>
      <div
        ref={containerRef}
        className="h-56 sm:h-64 w-full rounded-xl border border-slate-200 overflow-hidden z-0 [&.leaflet-container]:font-sans"
        aria-label="位置を地図で指定"
      />
    </div>
  );
}
