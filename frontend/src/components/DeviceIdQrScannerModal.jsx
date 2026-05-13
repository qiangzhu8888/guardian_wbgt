import { useEffect, useRef, useState } from 'react';
import { extractDeviceIdFromQrText } from '../lib/extractDeviceIdFromQr';

/**
 * カメラで QR を読み取り、検証済みのデバイス ID を親へ渡すモーダル。
 * @param {{ open: boolean, onClose: () => void, onDecoded: (deviceId: string) => void }} props
 */
export default function DeviceIdQrScannerModal({ open, onClose, onDecoded }) {
  const containerIdRef = useRef(
    `device-qr-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now())}`,
  );
  const scannerRef = useRef(null);
  const onDecodedRef = useRef(onDecoded);
  const onCloseRef = useRef(onClose);
  const [cameraErr, setCameraErr] = useState('');
  const [scanHint, setScanHint] = useState('');

  useEffect(() => {
    onDecodedRef.current = onDecoded;
  }, [onDecoded]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      setCameraErr('');
      setScanHint('');
      return undefined;
    }

    let cancelled = false;
    const containerId = containerIdRef.current;

    const stopScanner = async () => {
      const s = scannerRef.current;
      scannerRef.current = null;
      if (!s) return;
      try {
        await s.stop();
      } catch {
        /* 既に停止 */
      }
      try {
        s.clear();
      } catch {
        /* ignore */
      }
    };

    const run = async () => {
      setCameraErr('');
      setScanHint('カメラを起動しています…');
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled) return;
        const scanner = new Html5Qrcode(containerId, /* verbose */ false);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 8, qrbox: { width: 260, height: 260 } },
          (decodedText) => {
            const r = extractDeviceIdFromQrText(decodedText);
            if (r.ok) {
              setScanHint('');
              onDecodedRef.current(r.deviceId);
              stopScanner().finally(() => {
                if (!cancelled) onCloseRef.current();
              });
            } else {
              setScanHint(r.error);
            }
          },
          () => {
            /* フレームごとの未検出は無視 */
          },
        );
        if (!cancelled) setScanHint('QR コードを枠内に合わせてください');
      } catch {
        if (!cancelled) {
          setCameraErr('カメラを開始できませんでした。ブラウザの権限・HTTPS（または localhost）を確認してください。');
          setScanHint('');
        }
      }
    };

    run();

    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="device-qr-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="surface-card max-w-md w-full p-5 shadow-xl border border-slate-200 dark:border-slate-600">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h2 id="device-qr-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
              デバイス ID を QR スキャン
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              6〜24 桁の数字、または <code className="text-[11px] bg-slate-100 dark:bg-slate-800 px-1 rounded">deviceId</code>{' '}
              を含む JSON / URL に対応します。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            閉じる
          </button>
        </div>

        <div
          id={containerIdRef.current}
          className="rounded-xl overflow-hidden bg-black min-h-[220px] w-full max-w-[320px] mx-auto"
        />

        {cameraErr ? (
          <p className="mt-3 text-sm text-red-700 dark:text-red-300">{cameraErr}</p>
        ) : scanHint ? (
          <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">{scanHint}</p>
        ) : null}
      </div>
    </div>
  );
}
