// src/App.jsx - Main React Application
import React, { useState, useEffect } from 'react';
import PanelWrapper from './components/PanelWrapper';

function App({ shadowRoot }) {
  const [isVisible, setIsVisible] = useState(true);
  const [activeTab, setActiveTab] = useState('accessibility');
  const [pageData, setPageData] = useState(null);
  
  useEffect(() => {
    // Listen for messages from content script
    const messageListener = (event) => {
      if (event.source !== window) return;
      
      const { type, data } = event.data;
      switch (type) {
        case 'ASTRA_PAGE_DATA':
          setPageData(data);
          break;
        case 'ASTRA_TOGGLE':
          setIsVisible(prev => !prev);
          break;
      }
    };
    
    window.addEventListener('message', messageListener);
    return () => window.removeEventListener('message', messageListener);
  }, []);
  
  if (!isVisible) return null;
  
  return (
    <PanelWrapper
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      pageData={pageData}
      onClose={() => setIsVisible(false)}
      shadowRoot={shadowRoot}
    />
  );
}