import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css';
import './i18n';
import App from './App';

async function boot() {
  // Clickable prototype build only: answer API calls from in-browser sample data.
  if (import.meta.env.VITE_PROTOTYPE === '1') (await import('./prototype/install')).installPrototype();
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
void boot();
