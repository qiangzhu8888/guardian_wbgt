import { useSyncExternalStore } from 'react';

/** @param {() => void} onStoreChange */
function subscribe(onStoreChange) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const onMq = () => onStoreChange();
  mq.addEventListener('change', onMq);

  const obs = new MutationObserver(() => onStoreChange());
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  return () => {
    mq.removeEventListener('change', onMq);
    obs.disconnect();
  };
}

function getSnapshot() {
  return document.documentElement.classList.contains('dark');
}

function getServerSnapshot() {
  return false;
}

/** `<html class="dark">` の有無（テーマトグル・全画面以外でも利用可） */
export function useDarkClass() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
