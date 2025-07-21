// src/services/apiService.js - Backend API Communication
export class ApiService {
  constructor() {
    this.baseUrl = 'https://your-astra-app.vercel.app/api';
  }
  
  async analyzeWithClaude(pageData) {
    try {
      const response = await fetch(`${this.baseUrl}/analyze-design`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: pageData.url,
          title: pageData.title,
          html: pageData.html,
          styles: pageData.styles,
          screenshot: pageData.screenshot,
          tokens: pageData.tokens,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Claude analysis failed:', error);
      throw error;
    }
  }
  
  async saveReport(reportData) {
    try {
      const response = await fetch(`${this.baseUrl}/report/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save report: ${response.status}`);
      }
      
      const result = await response.json();
      return result.uuid;
    } catch (error) {
      console.error('Save report failed:', error);
      throw error;
    }
  }
  
  async getReport(uuid) {
    try {
      const response = await fetch(`${this.baseUrl}/report/${uuid}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch report: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get report failed:', error);
      throw error;
    }
  }
}