import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Guard against benign Firestore connection retry diagnostics and Vite HMR messages in iframe sandbox
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const firstArg = args[0];
  const msg = typeof firstArg === 'string' ? firstArg : (firstArg instanceof Error ? firstArg.message : '');
  if (
    msg.includes('[vite]') ||
    msg.includes('Could not reach Cloud Firestore backend') ||
    msg.includes('The client will operate in offline mode') ||
    msg.includes('@firebase/firestore')
  ) {
    return;
  }
  originalConsoleError(...args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
