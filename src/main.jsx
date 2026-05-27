import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initializeSupabase } from './config/supabaseClient';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

function renderApp() {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

function renderConfigError(message) {
  root.render(
    <React.StrictMode>
      <div className="app-loading">
        {message}
      </div>
    </React.StrictMode>
  );
}

initializeSupabase()
  .then(renderApp)
  .catch((error) => {
    console.error('Failed to initialize Supabase client:', error);
    renderConfigError(
      'Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, or configure SUPABASE_URL and SUPABASE_ANON_KEY for /api/config.'
    );
  });