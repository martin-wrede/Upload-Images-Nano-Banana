import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App'; // Manual upload page
import Automation from './pages/Automation'; // R2 automation page

const root = document.getElementById('root');

// Simple routing based on URL path
const path = window.location.pathname;
const RootComponent = path === '/automation' ? Automation : App;

createRoot(root).render(
  <React.StrictMode>
    <RootComponent />
  </React.StrictMode>
);
