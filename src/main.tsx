import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Fix for getLayoutMap() error in iframe environments
const nav = typeof navigator !== 'undefined' ? navigator as any : null;
if (nav && nav.keyboard && typeof nav.keyboard.getLayoutMap === 'function') {
  const originalGetLayoutMap = nav.keyboard.getLayoutMap.bind(nav.keyboard);
  nav.keyboard.getLayoutMap = function() {
    return originalGetLayoutMap().catch((err: any) => {
      console.warn('Keyboard layout map access restricted in iframe:', err.message);
      return new Map(); // Return empty map as fallback
    });
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
