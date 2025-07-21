// src/services/tokenService.js - Design Token Validation Service
export class TokenService {
  constructor() {
    this.tokens = null;
    this.computedStyles = new Map();
  }
  
  loadTokens(tokenData) {
    this.tokens = this.flattenTokens(tokenData);
    console.log('📋 Design tokens loaded:', Object.keys(this.tokens).length, 'tokens');
  }
  
  // Flatten nested token structure
  flattenTokens(obj, prefix = '') {
    const flattened = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value) && !value.value) {
        Object.assign(flattened, this.flattenTokens(value, newKey));
      } else {
        flattened[newKey] = value.value || value;
      }
    }
    
    return flattened;
  }
  
  async validatePageStyles() {
    if (!this.tokens) {
      throw new Error('No design tokens loaded');
    }
    
    const issues = [];
    const elements = this.getVisibleElements();
    
    for (const element of elements) {
      const styles = this.extractElementStyles(element);
      const elementIssues = this.compareWithTokens(element, styles);
      issues.push(...elementIssues);
    }
    
    return this.groupIssuesByType(issues);
  }
  
  getVisibleElements() {
    const elements = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          // Skip invisible elements and Astra's own elements
          const rect = node.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return NodeFilter.FILTER_SKIP;
          if (node.id === 'astra-extension-root') return NodeFilter.FILTER_SKIP;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    
    let node;
    while (node = walker.nextNode()) {
      elements.push(node);
    }
    
    return elements.slice(0, 100); // Limit for performance
  }
  
  extractElementStyles(element) {
    const computed = window.getComputedStyle(element);
    
    return {
      color: this.rgbToHex(computed.color),
      backgroundColor: this.rgbToHex(computed.backgroundColor),
      fontSize: computed.fontSize,
      fontFamily: computed.fontFamily.split(',')[0].replace(/['"]/g, ''),
      fontWeight: computed.fontWeight,
      lineHeight: computed.lineHeight,
      borderRadius: computed.borderRadius,
      padding: computed.padding,
      margin: computed.margin,
      borderWidth: computed.borderWidth,
      borderColor: this.rgbToHex(computed.borderColor)
    };
  }
  
  compareWithTokens(element, styles) {
    const issues = [];
    const selector = this.generateSelector(element);
    
    // Color validation
    if (styles.color && styles.color !== '#000000') {
      const colorMatch = this.findClosestToken(styles.color, 'color');
      if (!colorMatch.exact && colorMatch.distance > 10) {
        issues.push({
          element: selector,
          property: 'color',
          actual: styles.color,
          expected: colorMatch.token ? this.tokens[colorMatch.token] : 'unknown',
          token: colorMatch.token,
          severity: this.getSeverity(colorMatch.distance),
          type: 'color-mismatch'
        });
      }
    }
    
    // Font size validation
    if (styles.fontSize) {
      const fontSizeMatch = this.findClosestToken(styles.fontSize, 'fontSize', 'font', 'text');
      if (!fontSizeMatch.exact && fontSizeMatch.distance > 2) {
        issues.push({
          element: selector,
          property: 'fontSize',
          actual: styles.fontSize,
          expected: fontSizeMatch.token ? this.tokens[fontSizeMatch.token] : 'unknown',
          token: fontSizeMatch.token,
          severity: 'medium',
          type: 'font-mismatch'
        });
      }
    }
    
    // Background color validation
    if (styles.backgroundColor && styles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
      const bgMatch = this.findClosestToken(styles.backgroundColor, 'background', 'bg');
      if (!bgMatch.exact && bgMatch.distance > 10) {
        issues.push({
          element: selector,
          property: 'backgroundColor',
          actual: styles.backgroundColor,
          expected: bgMatch.token ? this.tokens[bgMatch.token] : 'unknown',
          token: bgMatch.token,
          severity: this.getSeverity(bgMatch.distance),
          type: 'background-mismatch'
        });
      }
    }
    
    // Border radius validation
    if (styles.borderRadius && styles.borderRadius !== '0px') {
      const radiusMatch = this.findClosestToken(styles.borderRadius, 'radius', 'border');
      if (!radiusMatch.exact) {
        issues.push({
          element: selector,
          property: 'borderRadius',
          actual: styles.borderRadius,
          expected: radiusMatch.token ? this.tokens[radiusMatch.token] : 'unknown',
          token: radiusMatch.token,
          severity: 'low',
          type: 'border-mismatch'
        });
      }
    }
    
    return issues;
  }
  
  findClosestToken(value, ...categories) {
    let closestDistance = Infinity;
    let closestToken = null;
    let exactMatch = false;
    
    for (const [tokenName, tokenValue] of Object.entries(this.tokens)) {
      // Check if token belongs to relevant categories
      const isRelevant = categories.some(category => 
        tokenName.toLowerCase().includes(category.toLowerCase())
      );
      
      if (!isRelevant) continue;
      
      const distance = this.calculateDistance(value, tokenValue);
      
      if (distance === 0) {
        return { token: tokenName, distance: 0, exact: true };
      }
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestToken = tokenName;
      }
    }
    
    return { 
      token: closestToken, 
      distance: closestDistance, 
      exact: exactMatch 
    };
  }
  
  calculateDistance(value1, value2) {
    // Color distance (hex values)
    if (value1.startsWith('#') && value2.startsWith('#')) {
      return this.colorDistance(value1, value2);
    }
    
    // Numeric distance (px, rem, em, etc.)
    const num1 = parseFloat(value1);
    const num2 = parseFloat(value2);
    
    if (!isNaN(num1) && !isNaN(num2)) {
      return Math.abs(num1 - num2);
    }
    
    // String exact match
    return value1 === value2 ? 0 : 100;
  }
  
  colorDistance(hex1, hex2) {
    const rgb1 = this.hexToRgb(hex1);
    const rgb2 = this.hexToRgb(hex2);
    
    if (!rgb1 || !rgb2) return 100;
    
    // Euclidean distance in RGB space
    return Math.sqrt(
      Math.pow(rgb1.r - rgb2.r, 2) +
      Math.pow(rgb1.g - rgb2.g, 2) +
      Math.pow(rgb1.b - rgb2.b, 2)
    );
  }
  
  rgbToHex(rgb) {
    if (rgb === 'rgba(0, 0, 0, 0)' || rgb === 'transparent') {
      return 'transparent';
    }
    
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return rgb;
    
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }
  
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
  
  generateSelector(element) {
    if (element.id) return `#${element.id}`;
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c);
      if (classes.length > 0) return `.${classes[0]}`;
    }
    return element.tagName.toLowerCase();
  }
  
  getSeverity(distance) {
    if (distance > 50) return 'high';
    if (distance > 20) return 'medium';
    return 'low';
  }
  
  groupIssuesByType(issues) {
    const grouped = {
      'color-mismatch': [],
      'font-mismatch': [],
      'background-mismatch': [],
      'border-mismatch': [],
      'other': []
    };
    
    issues.forEach(issue => {
      const type = issue.type || 'other';
      if (grouped[type]) {
        grouped[type].push(issue);
      } else {
        grouped.other.push(issue);
      }
    });
    
    return grouped;
  }
}