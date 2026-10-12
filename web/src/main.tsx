import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import './tokens/tokens.css';
import './ui/global.css';
import { App } from './App';
import { AuthProvider } from './lib/auth';
import { LiveBrandProvider } from './lib/liveBrands';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LiveBrandProvider><App /></LiveBrandProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
