// background.js - Chrome Extension Service Worker
// Handles extension icon clicks, installation, and inter-component communication

console.log('🚀 Astra Design QA - Service Worker loaded');

// Handle extension icon clicks - toggle the floating panel
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Send message to content script to toggle panel
    await chrome.tabs.sendMessage(tab.id, { 
      type: 'TOGGLE_ASTRA',
      timestamp: Date.now()
    });
    
    console.log(`✨ Toggled Astra panel on ${tab.url}`);
  } catch (error) {
    console.error('Failed to toggle Astra panel:', error);
    
    // If content script not loaded, inject it
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      
      // Try again after injection
      setTimeout(async () => {
        try {
          await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_ASTRA' });
        } catch (retryError) {
          console.error('Retry failed:', retryError);
        }
      }, 500);
      
    } catch (injectionError) {
      console.error('Failed to inject content script:', injectionError);
    }
  }
});

// Handle extension installation and updates
chrome.runtime.onInstalled.addListener((details) => {
  console.log('🚀 Astra Design QA extension installed/updated');
  
  switch (details.reason) {
    case 'install':
      console.log('✅ Fresh installation - Welcome to Astra!');
      // Optional: Open welcome page or set default settings
      break;
      
    case 'update':
      console.log(`🔄 Updated from version ${details.previousVersion}`);
      // Optional: Show update notifications
      break;
      
    case 'chrome_update':
      console.log('🌐 Chrome browser updated');
      break;
  }
  
  // Set default settings
  chrome.storage.local.set({
    'astra-settings': {
      autoRun: false,
      apiUrl: 'https://astra-qa-v2.vercel.app/api',
      cacheExpiry: 3600000, // 1 hour
      enabledFeatures: {
        accessibility: true,
        aiAnalysis: true,
        tokenValidation: true,
        reportSharing: true
      }
    }
  });
});

// Handle messages from content scripts, popup, and other extension components
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Background received message:', message.type);
  
  switch (message.type) {
    case 'GET_ACTIVE_TAB':
      // Return active tab information
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          sendResponse({ 
            success: true, 
            tab: {
              id: tabs[0].id,
              url: tabs[0].url,
              title: tabs[0].title
            }
          });
        } else {
          sendResponse({ success: false, error: 'No active tab found' });
        }
      });
      return true; // Keep message channel open for async response
      
    case 'CAPTURE_SCREENSHOT':
      // Capture visible area of active tab
      chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ success: true, dataUrl });
        }
      });
      return true;
      
    case 'ANALYZE_PAGE':
      // Forward analysis request to backend API
      handlePageAnalysis(message.data, sendResponse);
      return true;
      
    case 'SAVE_ANALYSIS_RESULT':
      // Cache analysis result locally
      const cacheKey = `analysis-${message.data.url}-${Date.now()}`;
      chrome.storage.local.set({ [cacheKey]: message.data }, () => {
        sendResponse({ success: true, cacheKey });
      });
      return true;
      
    case 'GET_CACHED_ANALYSIS':
      // Retrieve cached analysis
      chrome.storage.local.get(message.cacheKey, (result) => {
        if (result[message.cacheKey]) {
          sendResponse({ success: true, data: result[message.cacheKey] });
        } else {
          sendResponse({ success: false, error: 'Cache miss' });
        }
      });
      return true;
      
    case 'CLEAR_CACHE':
      // Clear old cached analysis results
      chrome.storage.local.get(null, (allData) => {
        const keysToRemove = Object.keys(allData)
          .filter(key => key.startsWith('analysis-'))
          .slice(0, -10); // Keep only last 10 analyses
          
        if (keysToRemove.length > 0) {
          chrome.storage.local.remove(keysToRemove, () => {
            console.log(`🧹 Cleared ${keysToRemove.length} old cache entries`);
            sendResponse({ success: true, cleared: keysToRemove.length });
          });
        } else {
          sendResponse({ success: true, cleared: 0 });
        }
      });
      return true;
      
    case 'LOG_ERROR':
      // Centralized error logging
      console.error('🚨 Extension Error:', message.error);
      // Optional: Send to external error tracking service
      sendResponse({ success: true });
      break;
      
    case 'GET_SETTINGS':
      // Get extension settings
      chrome.storage.local.get('astra-settings', (result) => {
        sendResponse({ 
          success: true, 
          settings: result['astra-settings'] || {} 
        });
      });
      return true;
      
    case 'UPDATE_SETTINGS':
      // Update extension settings
      chrome.storage.local.set({ 'astra-settings': message.settings }, () => {
        console.log('⚙️ Settings updated:', message.settings);
        sendResponse({ success: true });
      });
      return true;
      
    default:
      console.warn('🤷 Unknown message type:', message.type);
      sendResponse({ success: false, error: 'Unknown message type' });
      break;
  }
});

// Handle API requests to avoid CORS issues (backup method)
async function handlePageAnalysis(data, sendResponse) {
  try {
    console.log('🤖 Forwarding analysis request to backend...');
    
    const response = await fetch('https://astra-qa-v2.vercel.app/api/analyze-design', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Astra-Extension/1.0.0'
      },
      body: JSON.stringify({
        ...data,
        source: 'chrome-extension',
        timestamp: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('✅ Analysis completed successfully');
    
    sendResponse({ success: true, data: result });
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    sendResponse({ 
      success: false, 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('🌅 Chrome started - Astra service worker ready');
});

// Handle extension suspension (cleanup)
chrome.runtime.onSuspend.addListener(() => {
  console.log('😴 Service worker suspending - cleaning up...');
  
  // Clear old cache entries before suspension
  chrome.storage.local.get(null, (allData) => {
    const oldKeys = Object.keys(allData)
      .filter(key => key.startsWith('analysis-'))
      .slice(0, -5); // Keep only 5 most recent
      
    if (oldKeys.length > 0) {
      chrome.storage.local.remove(oldKeys);
      console.log(`🧹 Cleaned ${oldKeys.length} cache entries`);
    }
  });
});

// Context menu integration (optional - for right-click functionality)
chrome.runtime.onInstalled.addListener(() => {
  // Add context menu item for "Analyze this page"
  chrome.contextMenus.create({
    id: 'analyze-page',
    title: '🔍 Analyze with Astra',
    contexts: ['page']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'analyze-page') {
    // Same as clicking extension icon
    chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_ASTRA' });
  }
});

// Tab update listener (optional - for auto-analysis)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only act when page is completely loaded
  if (changeInfo.status === 'complete' && tab.url) {
    // Optional: Auto-run analysis on specific domains
    // Currently disabled - can be enabled via settings
    
    chrome.storage.local.get('astra-settings', (result) => {
      const settings = result['astra-settings'] || {};
      
      if (settings.autoRun && tab.url.startsWith('https://')) {
        console.log(`🤖 Auto-analysis triggered for: ${tab.url}`);
        // Could auto-inject and run analysis here
      }
    });
  }
});

// Alarm listener for periodic cleanup
chrome.alarms.create('cleanup-cache', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanup-cache') {
    // Clean up old cache entries every hour
    chrome.storage.local.get(null, (allData) => {
      const expiredKeys = Object.keys(allData)
        .filter(key => {
          if (!key.startsWith('analysis-')) return false;
          
          // Extract timestamp from key (analysis-url-timestamp)
          const parts = key.split('-');
          const timestamp = parseInt(parts[parts.length - 1]);
          const age = Date.now() - timestamp;
          
          return age > 24 * 60 * 60 * 1000; // 24 hours
        });
        
      if (expiredKeys.length > 0) {
        chrome.storage.local.remove(expiredKeys);
        console.log(`🧹 Cleaned ${expiredKeys.length} expired cache entries`);
      }
    });
  }
});

// Error handling for uncaught exceptions
self.addEventListener('error', (event) => {
  console.error('🚨 Service Worker Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled Promise Rejection:', event.reason);
});

console.log('✅ Astra service worker initialization complete');