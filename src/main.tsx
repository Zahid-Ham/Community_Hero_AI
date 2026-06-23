import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './features/auth/AuthProvider.tsx';
import { ProtectedRoute } from './components/auth/ProtectedRoute.tsx';
import { NotificationProvider } from './features/notifications/NotificationProvider.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ProtectedRoute>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </ProtectedRoute>
    </AuthProvider>
  </StrictMode>,
);
