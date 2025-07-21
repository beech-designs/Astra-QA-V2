// src/components/tabs/AccessibilityTab.jsx
import React, { useState } from 'react';
import Button from '../shared/Button';
import LoadingSpinner from '../shared/LoadingSpinner';
import ResultCard from '../shared/ResultCard';

function AccessibilityTab({ pageData }) {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  
  const runAxeAudit = async () => {
    setIsRunning(true);
    setError(null);
    
    try {
      // Send message to content script to run axe
      window.postMessage({ type: 'ASTRA_RUN_AXE' }, '*');
      
      // Listen for results
      const resultListener = (event) => {
        if (event.data.type === 'ASTRA_AXE_RESULTS') {
          setResults(event.data.data);
          setIsRunning(false);
          window.removeEventListener('message', resultListener);
        }
      };
      
      window.addEventListener('message', resultListener);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (isRunning) {
          setError('Audit timed out');
          setIsRunning(false);
          window.removeEventListener('message', resultListener);
        }
      }, 10000);
      
    } catch (err) {
      setError(err.message);
      setIsRunning(false);
    }
  };
  
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Accessibility Audit</h3>
        <Button 
          onClick={runAxeAudit} 
          disabled={isRunning}
          className="bg-green-600 hover:bg-green-700"
        >
          {isRunning ? <LoadingSpinner size="sm" /> : '🔍'} Run Analysis
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
          Error: {error}
        </div>
      )}
      
      {results && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="bg-red-50 p-2 rounded text-center">
              <div className="font-bold text-red-600">{results.violations?.length || 0}</div>
              <div className="text-red-500">Violations</div>
            </div>
            <div className="bg-yellow-50 p-2 rounded text-center">
              <div className="font-bold text-yellow-600">{results.incomplete?.length || 0}</div>
              <div className="text-yellow-500">Incomplete</div>
            </div>
            <div className="bg-green-50 p-2 rounded text-center">
              <div className="font-bold text-green-600">{results.passes?.length || 0}</div>
              <div className="text-green-500">Passes</div>
            </div>
          </div>
          
          {results.violations?.map((violation, index) => (
            <ResultCard 
              key={index}
              type="violation"
              title={violation.description}
              severity={violation.impact}
              details={`${violation.nodes.length} element(s) affected`}
            />
          ))}
        </div>
      )}
      
      {!results && !isRunning && (
        <div className="text-center text-gray-500 py-8">
          Click "Run Analysis" to audit this page for accessibility issues
        </div>
      )}
    </div>
  );
}