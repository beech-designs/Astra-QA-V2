// src/components/tabs/TokenTab.jsx
import React, { useState } from 'react';
import Button from '../shared/Button';

function TokenTab({ pageData }) {
  const [tokens, setTokens] = useState(null);
  const [results, setResults] = useState(null);
  
  const handleTokenUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const tokenData = JSON.parse(e.target.result);
          setTokens(tokenData);
        } catch (error) {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    }
  };
  
  const validateTokens = async () => {
    if (!tokens) return;
    
    // Run token validation logic
    window.postMessage({ 
      type: 'ASTRA_VALIDATE_TOKENS',
      data: tokens 
    }, '*');
  };
  
  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Design Token Validation</h3>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          accept=".json"
          onChange={handleTokenUpload}
          className="hidden"
          id="token-upload"
        />
        <label htmlFor="token-upload" className="cursor-pointer">
          <div className="text-4xl mb-2">📄</div>
          <div className="text-sm text-gray-600">
            {tokens ? 'Tokens loaded ✓' : 'Upload design tokens JSON file'}
          </div>
        </label>
      </div>
      
      {tokens && (
        <Button onClick={validateTokens} className="w-full bg-blue-600 hover:bg-blue-700">
          🔍 Validate Against Page Styles
        </Button>
      )}
      
      {results && (
        <div className="space-y-2">
          {results.map((issue, index) => (
            <div key={index} className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
              <div className="font-medium">{issue.element}</div>
              <div className="text-gray-600">
                Expected <span className="font-mono">{issue.expected}</span>, 
                found <span className="font-mono">{issue.actual}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}