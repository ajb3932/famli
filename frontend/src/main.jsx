import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { LocaleProvider } from './context/LocaleContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { Background } from './components/layout/Background';
import { OfflineBanner, PwaUpdatePrompt } from './components/layout/SystemBanners';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <LocaleProvider>
            <ConfirmProvider>
              <BrowserRouter>
                <Background />
                <OfflineBanner />
                <PwaUpdatePrompt />
                <App />
              </BrowserRouter>
            </ConfirmProvider>
          </LocaleProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>
);
