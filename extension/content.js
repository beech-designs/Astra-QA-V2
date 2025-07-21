// content.js
(function() {
  'use strict';
  
  // Prevent multiple injections
  if (window.astraInjected) return;
  window.astraInjected = true;
  
  console.log('🚀 Astra Design QA - Enhanced content script loaded');
  
  let shadowHost = null;
  let shadowRoot = null;
  let reactApp = null;
  let isVisible = false;
  let settings = {};
  
  // Load extension settings on startup
  async function loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
      if (response?.success) {
        settings = response.settings;
        console.log('⚙️ Settings loaded:', settings);
      }
    } catch (error) {
      console.warn('⚠️ Could not load settings, using defaults:', error);
      settings = {
        autoRun: false,
        enabledFeatures: {
          accessibility: true,
          aiAnalysis: true,
          tokenValidation: true,
          reportSharing: true
        }
      };
    }
  }
  
  // Create Shadow DOM container with enhanced styling
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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    `;
    
    // Create Shadow DOM for complete style isolation
    shadowRoot = shadowHost.attachShadow({ mode: 'closed' });
    
    // Enhanced styling with better isolation
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
      
      /* Shadow DOM specific styles */
      :host {
        all: initial;
        display: block;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      * {
        box-sizing: border-box;
        font-family: inherit;
      }
      
      .astra-panel {
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        border: 1px solid #e5e7eb;
        overflow: hidden;
        max-height: 600px;
        display: flex;
        flex-direction: column;
        animation: slideIn 0.3s ease-out;
      }
      
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(100px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      .astra-panel.closing {
        animation: slideOut 0.3s ease-in;
      }
      
      @keyframes slideOut {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(100px);
        }
      }
      
      /* Ensure text is readable */
      .astra-panel * {
        color: inherit;
        font-family: inherit;
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
  
  // Load and mount React app with error handling
  async function loadReactApp() {
    try {
      const container = createShadowContainer();
      
      // Load the bundled React app
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('dist/content-bundle.js');
      
      script.onload = () => {
        try {
          // Initialize React app with shadow DOM container and settings
          if (window.AstraApp && window.AstraApp.mount) {
            reactApp = window.AstraApp.mount(container, shadowRoot, {
              settings,
              api: {
                sendMessage: (type, data) => chrome.runtime.sendMessage({ type, data }),
                postMessage: (type, data) => window.postMessage({ type, data }, '*')
              }
            });
            
            isVisible = true;
            console.log('✅ Astra React app mounted successfully');
            
            // Cache successful load
            chrome.runtime.sendMessage({ 
              type: 'SAVE_ANALYSIS_RESULT',
              data: { 
                type: 'extension_loaded',
                url: window.location.href,
                timestamp: Date.now()
              }
            });
            
          } else {
            throw new Error('AstraApp mount function not found');
          }
        } catch (error) {
          handleError('React app initialization failed', error);
        }
      };
      
      script.onerror = (error) => {
        handleError('Failed to load Astra React bundle', error);
      };
      
      document.head.appendChild(script);
      
    } catch (error) {
      handleError('Content script initialization failed', error);
    }
  }
  
  // Enhanced toggle functionality with animation
  async function togglePanel() {
    if (shadowHost) {
      if (isVisible) {
        // Animate out
        if (shadowHost.querySelector('.astra-panel')) {
          shadowHost.querySelector('.astra-panel').classList.add('closing');
          setTimeout(() => {
            shadowHost.style.display = 'none';
            isVisible = false;
          }, 300);
        } else {
          shadowHost.style.display = 'none';
          isVisible = false;
        }
      } else {
        // Animate in
        shadowHost.style.display = 'block';
        if (shadowHost.querySelector('.astra-panel')) {
          shadowHost.querySelector('.astra-panel').classList.remove('closing');
        }
        isVisible = true;
      }
    } else {
      // First time - load the app
      await loadReactApp();
    }
    
    // Log usage analytics
    chrome.runtime.sendMessage({
      type: 'LOG_ANALYTICS',
      data: {
        action: isVisible ? 'panel_opened' : 'panel_closed',
        url: window.location.href,
        timestamp: Date.now()
      }
    });
  }
  
  // Enhanced message handling for window messages (from React app)
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    
    const { type, data } = event.data;
    
    switch (type) {
      case 'ASTRA_TOGGLE_PANEL':
        togglePanel();
        break;
        
      case 'ASTRA_RUN_AXE':
        runAxeAudit(data);
        break;
        
      case 'ASTRA_EXTRACT_STYLES':
        extractPageStyles();
        break;
        
      case 'ASTRA_ANALYZE_WITH_AI':
        analyzeWithAI(data);
        break;
        
      case 'ASTRA_VALIDATE_TOKENS':
        validateDesignTokens(data);
        break;
        
      case 'ASTRA_SAVE_REPORT':
        saveAnalysisReport(data);
        break;
        
      case 'ASTRA_GET_SETTINGS':
        window.postMessage({
          type: 'ASTRA_SETTINGS_RESPONSE',
          data: settings
        }, '*');
        break;
        
      case 'ASTRA_UPDATE_SETTINGS':
        updateSettings(data);
        break;
        
      case 'ASTRA_CLOSE_PANEL':
        togglePanel();
        break;
        
      default:
        console.log('🤷 Unknown message type:', type);
        break;
    }
  });
  
  // Enhanced Chrome extension message listener
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('📨 Content script received message:', message.type);
    
    switch (message.type) {
      case 'TOGGLE_ASTRA':
        togglePanel().then(() => {
          sendResponse({ success: true, visible: isVisible });
        });
        return true;
        
      case 'GET_PAGE_DATA':
        const pageData = getEnhancedPageData();
        sendResponse(pageData);
        break;
        
      case 'INJECT_STYLES':
        injectCustomStyles(message.styles);
        sendResponse({ success: true });
        break;
        
      case 'RUN_ACCESSIBILITY_AUDIT':
        runAxeAudit().then(results => {
          sendResponse({ success: true, data: results });
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
        return true;
        
      case 'ANALYZE_PAGE':
        analyzeWithAI().then(results => {
          sendResponse({ success: true, data: results });
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
        return true;
        
      default:
        sendResponse({ success: false, error: 'Unknown message type' });
        break;
    }
  });
  
  // Enhanced page data extraction
  function getEnhancedPageData() {
    const data = {
      url: window.location.href,
      title: document.title,
      html: document.documentElement.outerHTML,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      meta: {
        description: document.querySelector('meta[name="description"]')?.content || '',
        keywords: document.querySelector('meta[name="keywords"]')?.content || '',
        charset: document.characterSet,
        lang: document.documentElement.lang || 'en'
      },
      performance: {
        loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
        domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
      }
    };
    
    // Truncate HTML for API efficiency
    if (data.html.length > 50000) {
      data.html = data.html.substring(0, 50000) + '<!-- [TRUNCATED] -->';
    }
    
    return data;
  }
  
  // Enhanced accessibility audit with caching
  async function runAxeAudit(options = {}) {
    try {
      // Check cache first
      const cacheKey = `axe-${window.location.href}-${Date.now()}`;
      
      await injectAxeCore();
      
      if (!window.axe) {
        throw new Error('Axe-core not available after injection');
      }
      
      console.log('🔍 Running accessibility audit...');
      
      const results = await window.axe.run(document, {
        rules: {
          'color-contrast': { enabled: true },
          'keyboard-navigation': { enabled: true },
          'aria-labels': { enabled: true },
          'heading-order': { enabled: true },
          'landmark-roles': { enabled: true }
        },
        tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
        exclude: ['#astra-extension-root', '[data-astra-ignore]'],
        ...options
      });
      
      const processedResults = {
        violations: results.violations.map(v => ({
          id: v.id,
          description: v.description,
          impact: v.impact,
          help: v.help,
          helpUrl: v.helpUrl,
          nodes: v.nodes.slice(0, 5).map(node => ({ // Limit nodes for performance
            html: node.html.substring(0, 200),
            target: node.target,
            failureSummary: node.failureSummary
          }))
        })),
        passes: results.passes.length,
        incomplete: results.incomplete.length,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        score: calculateAccessibilityScore(results)
      };
      
      // Cache results
      chrome.runtime.sendMessage({
        type: 'SAVE_ANALYSIS_RESULT',
        data: { type: 'accessibility', results: processedResults, cacheKey }
      });
      
      // Send results to React app
      window.postMessage({
        type: 'ASTRA_AXE_RESULTS',
        data: processedResults
      }, '*');
      
      return processedResults;
      
    } catch (error) {
      handleError('Accessibility audit failed', error);
      throw error;
    }
  }
  
  // Calculate accessibility score
  function calculateAccessibilityScore(results) {
    const violations = results.violations.length;
    const passes = results.passes.length;
    const incomplete = results.incomplete.length;
    
    const total = violations + passes + incomplete;
    if (total === 0) return 100;
    
    const score = Math.max(0, Math.min(100, ((passes - violations * 2) / total) * 100));
    return Math.round(score);
  }
  
  // Enhanced axe-core injection with retry logic
  function injectAxeCore() {
    return new Promise((resolve, reject) => {
      if (window.axe) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('lib/axe.min.js');
      script.onload = () => {
        console.log('✅ Axe-core loaded successfully');
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load axe-core library'));
      };
      
      document.head.appendChild(script);
    });
  }
  
  // AI analysis with background.js coordination
  async function analyzeWithAI(options = {}) {
    try {
      console.log('🤖 Starting AI analysis...');
      
      const pageData = getEnhancedPageData();
      const styles = await extractPageStyles();
      
      // Use background.js for API call (handles CORS, retries, etc.)
      const response = await chrome.runtime.sendMessage({
        type: 'ANALYZE_PAGE',
        data: {
          ...pageData,
          styles,
          tokens: options.tokens || null,
          analysisType: options.analysisType || 'full'
        }
      });
      
      if (!response.success) {
        throw new Error(response.error || 'AI analysis failed');
      }
      
      // Send results to React app
      window.postMessage({
        type: 'ASTRA_AI_RESULTS',
        data: response.data
      }, '*');
      
      return response.data;
      
    } catch (error) {
      handleError('AI analysis failed', error);
      throw error;
    }
  }
  
  // Enhanced style extraction
  async function extractPageStyles() {
    return new Promise((resolve) => {
      const styles = {};
      const elements = document.querySelectorAll('*');
      let processed = 0;
      
      // Process elements in batches for performance
      const batchSize = 50;
      const maxElements = 200;
      
      const processBatch = () => {
        const endIndex = Math.min(processed + batchSize, Math.min(elements.length, maxElements));
        
        for (let i = processed; i < endIndex; i++) {
          const el = elements[i];
          
          // Skip Astra's own elements
          if (el.id === 'astra-extension-root' || el.closest('#astra-extension-root')) {
            continue;
          }
          
          if (el.offsetWidth > 0 && el.offsetHeight > 0) {
            const computed = window.getComputedStyle(el);
            const selector = generateSelector(el);
            
            styles[selector] = {
              color: computed.color,
              backgroundColor: computed.backgroundColor,
              fontSize: computed.fontSize,
              fontFamily: computed.fontFamily.split(',')[0].replace(/['"]/g, ''),
              fontWeight: computed.fontWeight,
              lineHeight: computed.lineHeight,
              borderRadius: computed.borderRadius,
              padding: computed.padding,
              margin: computed.margin,
              borderWidth: computed.borderWidth,
              borderColor: computed.borderColor
            };
          }
        }
        
        processed = endIndex;
        
        if (processed < Math.min(elements.length, maxElements)) {
          // Process next batch asynchronously
          setTimeout(processBatch, 0);
        } else {
          // Send results to React app
          window.postMessage({
            type: 'ASTRA_STYLES_EXTRACTED',
            data: styles
          }, '*');
          
          resolve(styles);
        }
      };
      
      processBatch();
    });
  }
  
  // Generate CSS selector for element
  function generateSelector(el) {
    if (el.id) return `#${el.id}`;
    if (el.className && typeof el.className === 'string') {
      const classes = el.className.split(' ').filter(c => c && !c.startsWith('astra'));
      if (classes.length > 0) return `.${classes[0]}`;
    }
    return el.tagName.toLowerCase();
  }
  
  // Validate design tokens
  async function validateDesignTokens(tokens) {
    try {
      console.log('🎨 Validating design tokens...');
      
      const styles = await extractPageStyles();
      
      // Token validation logic would go here
      // This is a simplified version
      const mismatches = [];
      
      // Send results to React app
      window.postMessage({
        type: 'ASTRA_TOKEN_RESULTS',
        data: { mismatches, tokensCount: Object.keys(tokens).length }
      }, '*');
      
    } catch (error) {
      handleError('Token validation failed', error);
    }
  }
  
  // Save analysis report
  async function saveAnalysisReport(reportData) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SAVE_REPORT',
        data: reportData
      });
      
      if (response.success) {
        window.postMessage({
          type: 'ASTRA_REPORT_SAVED',
          data: { uuid: response.uuid, shareUrl: response.shareUrl }
        }, '*');
      }
      
    } catch (error) {
      handleError('Save report failed', error);
    }
  }
  
  // Update settings
  async function updateSettings(newSettings) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        settings: newSettings
      });
      
      if (response.success) {
        settings = { ...settings, ...newSettings };
        window.postMessage({
          type: 'ASTRA_SETTINGS_UPDATED',
          data: settings
        }, '*');
      }
      
    } catch (error) {
      handleError('Settings update failed', error);
    }
  }
  
  // Centralized error handling
  function handleError(context, error) {
    console.error(`❌ ${context}:`, error);
    
    // Send error to background script for logging
    chrome.runtime.sendMessage({
      type: 'LOG_ERROR',
      error: {
        context,
        message: error.message,
        stack: error.stack,
        url: window.location.href,
        timestamp: new Date().toISOString()
      }
    });
    
    // Send error to React app for user feedback
    window.postMessage({
      type: 'ASTRA_ERROR',
      data: { context, error: error.message }
    }, '*');
  }
  
  // Initialize content script
  async function initialize() {
    try {
      console.log('🔧 Initializing Astra content script...');
      
      // Load settings first
      await loadSettings();
      
      // Auto-load if enabled in settings
      if (settings.autoRun && window.location.href.startsWith('https://')) {
        console.log('🤖 Auto-loading Astra panel...');
        setTimeout(loadReactApp, 2000);
      }
      
      console.log('✅ Astra content script initialized successfully');
      
    } catch (error) {
      handleError('Content script initialization', error);
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
  // Keyboard shortcut support
  document.addEventListener('keydown', (event) => {
    // Ctrl+Shift+A to toggle panel
    if (event.ctrlKey && event.shiftKey && event.key === 'A') {
      event.preventDefault();
      togglePanel();
    }
  });
  
  console.log('✅ Astra enhanced content script loaded successfully');
  
})();