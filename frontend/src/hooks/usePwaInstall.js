import { useCallback, useEffect, useState } from 'react';
import {
  isIosDevice,
  isStandaloneDisplay,
  PWA_INSTALL_DISMISS_DAYS,
  readDismissUntilMs,
  writeDismissUntilMs,
} from '../lib/pwaInstallHelpers';

const DISMISS_MS = PWA_INSTALL_DISMISS_DAYS * 24 * 60 * 60 * 1000;

/**
 * PWA インストール案内の表示・Chrome/Edge の prompt・閉じる期限の管理
 * @returns {{
 *   visible: boolean,
 *   canNativeInstall: boolean,
 *   showIosSteps: boolean,
 *   busy: boolean,
 *   install: () => Promise<void>,
 *   dismiss: () => void,
 * }}
 */
export function usePwaInstall() {
  const [standalone, setStandalone] = useState(() =>
    typeof window !== 'undefined' ? isStandaloneDisplay() : false,
  );
  const [dismissActive, setDismissActive] = useState(() =>
    typeof window !== 'undefined' ? readDismissUntilMs() != null : false,
  );
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [busy, setBusy] = useState(false);

  const ios = isIosDevice();
  const canNativeInstall = Boolean(
    deferredPrompt &&
      typeof deferredPrompt === 'object' &&
      typeof deferredPrompt.prompt === 'function',
  );

  useEffect(() => {
    setStandalone(isStandaloneDisplay());
    setDismissActive(readDismissUntilMs() != null);
  }, []);

  useEffect(() => {
    if (standalone || dismissActive || installed) return undefined;

    const onBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, [standalone, dismissActive, installed]);

  const dismiss = useCallback(() => {
    writeDismissUntilMs(Date.now() + DISMISS_MS);
    setDismissActive(true);
    setDeferredPrompt(null);
  }, []);

  const install = useCallback(async () => {
    const p = deferredPrompt;
    if (!p || typeof p.prompt !== 'function') return;
    setBusy(true);
    try {
      await p.prompt();
      if ('userChoice' in p && p.userChoice) await p.userChoice;
    } catch {
      /* キャンセル等は握りつぶす */
    } finally {
      setBusy(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const visible =
    !standalone &&
    !dismissActive &&
    !installed &&
    (canNativeInstall || ios);

  const showIosSteps = ios;

  return {
    visible,
    canNativeInstall,
    showIosSteps,
    busy,
    install,
    dismiss,
  };
}
