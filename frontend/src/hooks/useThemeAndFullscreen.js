import { useCallback, useEffect, useState } from 'react';
import { toggleColorScheme } from '../lib/themeInit';
import { useDarkClass } from './useDarkClass';

export function useThemeAndFullscreen() {
  const isDark = useDarkClass();
  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(document.fullscreenElement));

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const toggleDarkMode = useCallback(() => {
    toggleColorScheme();
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch {
      /* 非対応ブラウザ・ユーザー拒否 */
    }
  }, []);

  return { isDark, toggleDarkMode, isFullscreen, toggleFullscreen };
}
