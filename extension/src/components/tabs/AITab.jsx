// src/components/tabs/AITab.jsx
import React, { useState } from 'react';
import Button from '../shared/Button';
import LoadingSpinner from '../shared/LoadingSpinner';

function AITab({ pageData }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  
  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    
    try {
      // Extract page data for Claude analysis
      const analysisData = {
        url: window.location.href,
        title: document.title,
        html: document.documentElement.innerHTML,
        styles: await extractStyles(),
        screenshot: await captureScreenshot()
      };
      
      // Send to backend API
      const response = await fetch('https://astra-qa-v2.vercel.app/api/analyze-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysisData)
      });
      
      const result = await response.json();
      setResults(result);
    } catch (error) {
      console.error('AI Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const extractStyles = () => {
    return new Promise((resolve) => {
      window.postMessage({ type: 'ASTRA_EXTRACT_STYLES' }, '*');
      const listener = (event) => {
        if (event.data.type === 'ASTRA_STYLES_EXTRACTED') {
          resolve(event.data.data);
          window.removeEventListener('message', listener);
        }
      };
      window.addEventListener('message', listener);
    });
  };
  
  const captureScreenshot = () => {
    // Implementation for screenshot capture
    return Promise.resolve(null);
  };
  
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">AI Design Analysis</h3>
        <Button 
          onClick={runAIAnalysis} 
          disabled={isAnalyzing}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isAnalyzing ? <LoadingSpinner size="sm" /> : '🤖'} Analyze with Claude
        </Button>
      </div>
      
      {results ? (
        <div className="space-y-3">
          {results.issues?.map((issue, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3">
              <div className="font-medium text-gray-900">{issue.title}</div>
              <div className="text-sm text-gray-600 mt-1">{issue.description}</div>
              <div className={`text-xs mt-2 px-2 py-1 rounded ${
                issue.severity === 'high' ? 'bg-red-100 text-red-700' :
                issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {issue.severity} priority
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          AI analysis uses Claude 3.5 Sonnet to identify design inconsistencies and improvements
        </div>
      )}
    </div>
  );
}