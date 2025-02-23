import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

console.log('cubes height', window.innerHeight)

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<React.StrictMode><App /></React.StrictMode>);