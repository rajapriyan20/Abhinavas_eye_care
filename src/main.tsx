import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Completely disable right click context menu across the entire app
window.addEventListener('contextmenu', e => e.preventDefault());

createRoot(document.getElementById('root')!).render(<App />);
