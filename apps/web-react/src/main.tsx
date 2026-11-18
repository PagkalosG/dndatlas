import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import './index.css';
import { I18nProvider } from '@/i18n';
import { AppStateProvider } from '@/app/AppState';
import { App } from '@/app/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <AppStateProvider>
        {/* HashRouter keeps GitHub Pages hosting working without server rewrites. */}
        <HashRouter>
          <App />
        </HashRouter>
      </AppStateProvider>
    </I18nProvider>
  </StrictMode>,
);
