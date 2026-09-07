import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Route all relative /api calls to VITE_API_URL when configured, and ensure credentials: 'include'
const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const originalFetch = window.fetch;

window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  let targetUrl = input;

  if (typeof input === 'string') {
    if (apiBase && input.startsWith('/api')) {
      targetUrl = `${apiBase}${input}`;
    }
  } else if (input instanceof URL) {
    if (apiBase && input.pathname.startsWith('/api') && input.origin === window.location.origin) {
      targetUrl = `${apiBase}${input.pathname}${input.search}`;
    }
  }

  return originalFetch(targetUrl, {
    credentials: 'include',
    ...init,
  });
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

