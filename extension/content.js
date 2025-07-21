// content.js - Injected content script
(function() {
  'use strict';
  
  // Prevent multiple injections
  if (window.astraInjected) return;
  window.astraInjected = true;
  
  console.log('🚀 Astra Design QA - Content script loaded');
  
  let shadowHost = null;
  let shadowRoot = null;
  let reactApp = null;
  
  // Create Shadow DOM container
  function createShadowContainer() {
    shadowHost = document.createElement('div');
    shadowHost.id = 'astra-extension-root';
    shadowHost.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      right: 20px !important;
      z-index: 999999 !important;
      width: 400px !important;
      max-height: 600px !important;
      pointer-events: auto !important;
    `;
    
    // Create Shadow DOM for style isolation
    shadowRoot = shadowHost.attachShadow({ mode: 'closed' });
    
    // Inject Tailwind and custom styles
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
      
      /* Shadow DOM specific styles */
      :host {
        all: initial;
        display: block;
      }
      
      * {
        box-sizing: border-box;
      }
      
      .astra-panel {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        border: 1px solid #e5e7eb;
        overflow: hidden;
        max-height: 600px;
        display: flex;
        flex-direction: column;
      }
    `;
    shadowRoot.appendChild(style);
    
    // Create React mount point
    const reactContainer = document.createElement('div');
    reactContainer.id = 'astra-react-root';
    shadowRoot.appendChild(reactContainer);
    
    document.body.appendChild(shadowHost);
    return reactContainer;
  }
  
  // Load and mount React app
  function loadReactApp() {
    const container = createShadowContainer();
    
    // Load the bundled React app
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('dist/content-bundle.js');
    script.onload = () => {
      // Initialize React app with shadow DOM container
      if (window.AstraApp && window.AstraApp.mount) {
        reactApp = window.AstraApp.mount(container, shadowRoot);
        console.log('✅ Astra React app mounted successfully');
      }
    };
    script.onerror = () => {
      console.error('❌ Failed to load Astra React bundle');
    };
    
    document.head.appendChild(script);
  }
  
  // Message listener for extension communication
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    
    const { type, data } = event.data;
    
    switch (type) {
      case 'ASTRA_TOGGLE_PANEL':
        togglePanel();
        break;
      case 'ASTRA_RUN_AXE':
        runAxeAudit();
        break;
      case 'ASTRA_EXTRACT_STYLES':
        extractPageStyles();
        break;
      default:
        break;
    }
  });
  
  // Chrome extension message listener
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'TOGGLE_ASTRA':
        togglePanel();
        sendResponse({ success: true });
        break;
      case 'GET_PAGE_DATA':
        sendResponse(getPageData());
        break;
      default:
        break;
    }
  });
  
  function togglePanel() {
    if (shadowHost) {
      const isVisible = shadowHost.style.display !== 'none';
      shadowHost.style.display = isVisible ? 'none' : 'block';
    } else {
      loadReactApp();
    }
  }
  
  function getPageData() {
    return {
      url: window.location.href,
      title: document.title,
      html: document.documentElement.outerHTML,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  }
  
  function runAxeAudit() {
    // Inject axe-core and run audit
    injectAxeCore().then(() => {
      if (window.axe) {
        window.axe.run().then(results => {
          window.postMessage({
            type: 'ASTRA_AXE_RESULTS',
            data: results
          }, '*');
        });
      }
    });
  }
  
  function injectAxeCore() {
    return new Promise((resolve, reject) => {
      if (window.axe) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('lib/axe.min.js');
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  function extractPageStyles() {
    const styles = {};
    const elements = document.querySelectorAll('*');
    
    elements.forEach(el => {
      if (el.offsetWidth > 0 && el.offsetHeight > 0) {
        const computed = window.getComputedStyle(el);
        const selector = generateSelector(el);
        
        styles[selector] = {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: computed.fontSize,
          fontFamily: computed.fontFamily,
          borderRadius: computed.borderRadius,
          padding: computed.padding,
          margin: computed.margin
        };
      }
    });
    
    window.postMessage({
      type: 'ASTRA_STYLES_EXTRACTED',
      data: styles
    }, '*');
  }
  
  function generateSelector(el) {
    if (el.id) return `#${el.id}`;
    if (el.className) return `.${el.className.split(' ')[0]}`;
    return el.tagName.toLowerCase();
  }
  
  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(loadReactApp, 1000);
    });
  } else {
    setTimeout(loadReactApp, 1000);
  }
})();

// background.js - Service Worker
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_ASTRA' });
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('🚀 Astra Design QA extension installed');
});

// Message handling between popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_ACTIVE_TAB':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        sendResponse({ tab: tabs[0] });
      });
      return true;
    case 'ANALYZE_PAGE':
      handlePageAnalysis(message.data, sendResponse);
      return true;
    default:
      break;
  }
});

async function handlePageAnalysis(data, sendResponse) {
  try {
    // Forward to backend API
    const response = await fetch('https://your-vercel-app.vercel.app/api/analyze-design', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    sendResponse({ success: true, data: result });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}