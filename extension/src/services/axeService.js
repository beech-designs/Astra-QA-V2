// src/services/axeService.js - Accessibility Testing Service
export class AxeService {
  constructor() {
    this.isAxeLoaded = false;
  }
  
  async loadAxeCore() {
    if (this.isAxeLoaded || window.axe) {
      return true;
    }
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('lib/axe.min.js');
      
      script.onload = () => {
        this.isAxeLoaded = true;
        console.log('✅ Axe-core loaded successfully');
        resolve(true);
      };
      
      script.onerror = () => {
        console.error('❌ Failed to load axe-core');
        reject(new Error('Failed to load axe-core library'));
      };
      
      document.head.appendChild(script);
    });
  }
  
  async runAudit(options = {}) {
    await this.loadAxeCore();
    
    if (!window.axe) {
      throw new Error('Axe-core not available');
    }
    
    const defaultOptions = {
      // Include specific rules
      rules: {
        'color-contrast': { enabled: true },
        'keyboard-navigation': { enabled: true },
        'aria-labels': { enabled: true },
        'heading-order': { enabled: true }
      },
      // Tags to include
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
      // Elements to exclude
      exclude: ['iframe', '[data-astra-ignore]']
    };
    
    const auditOptions = { ...defaultOptions, ...options };
    
    try {
      const results = await window.axe.run(document, auditOptions);
      return this.formatResults(results);
    } catch (error) {
      console.error('Axe audit failed:', error);
      throw error;
    }
  }
  
  formatResults(results) {
    return {
      violations: results.violations.map(violation => ({
        id: violation.id,
        description: violation.description,
        impact: violation.impact,
        help: violation.help,
        helpUrl: violation.helpUrl,
        nodes: violation.nodes.map(node => ({
          html: node.html,
          target: node.target,
          failureSummary: node.failureSummary
        }))
      })),
      passes: results.passes.length,
      incomplete: results.incomplete.map(item => ({
        id: item.id,
        description: item.description,
        nodes: item.nodes.length
      })),
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
  }
  
  // Get specific accessibility metrics
  async getAccessibilityScore() {
    const results = await this.runAudit();
    const total = results.violations.length + results.passes;
    const score = total > 0 ? (results.passes / total) * 100 : 100;
    
    return {
      score: Math.round(score),
      violations: results.violations.length,
      passes: results.passes,
      grade: this.getGrade(score)
    };
  }
  
  getGrade(score) {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }
}