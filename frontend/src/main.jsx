import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { applyColorScheme } from './lib/themeInit';
import { initFirebaseWeb } from './lib/firebaseWeb';
import './index.css';
import App from './App.jsx';

void initFirebaseWeb().catch(() => {
  /* Analytics 非対応環境・設定未完了は握りつぶす */
});
applyColorScheme();
registerSW({ immediate: true });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);