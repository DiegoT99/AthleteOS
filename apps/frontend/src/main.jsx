import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CategoryProvider } from './context/CategoryContext';

const savedTheme = localStorage.getItem('athleteos_theme') || 'dark';
document.documentElement.classList.toggle('dark', savedTheme === 'dark');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CategoryProvider>
          <App />
        </CategoryProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);

if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  } else {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
  }
}
