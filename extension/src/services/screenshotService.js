// src/services/screenshotService.js - Page Screenshot Capture
export class ScreenshotService {
  async captureVisible() {
    try {
      // Use Chrome extension API to capture visible tab
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { type: 'CAPTURE_SCREENSHOT' },
          (response) => {
            resolve(response.dataUrl);
          }
        );
      });
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      return null;
    }
  }
  
  async captureElement(element) {
    try {
      // Use html2canvas or similar for element-specific capture
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const rect = element.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // This is a simplified implementation
      // In production, you'd use html2canvas or dom-to-image
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Element screenshot failed:', error);
      return null;
    }
  }
}