import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { ensureSeed } from './seed/seedData';
import './index.css';
import 'leaflet/dist/leaflet.css';

// Install demo seed on first run (idempotent).
ensureSeed().catch((err) => console.error('Falha ao instalar o seed:', err));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
