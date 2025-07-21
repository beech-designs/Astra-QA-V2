// src/index.js - React App Entry Point and Mount Function
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Global mount function for content script
window.AstraApp = {
  mount: (container, shadowRoot) => {
    const root = createRoot(container);
    root.render(<App shadowRoot={shadowRoot} />);
    return root;
  }
};

export default App;