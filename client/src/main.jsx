/**
 * main.jsx — TradeFinX entry point
 *
 * Mounts the React application inside <div id="root"> (see index.html).
 * BrowserRouter is declared here so App.jsx can use <Routes> directly.
 * AuthProvider lives inside App.jsx so auth context is available to all routes.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
