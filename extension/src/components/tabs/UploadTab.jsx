// src/components/tabs/UploadTab.jsx
import React, { useState } from 'react';
import Button from '../shared/Button';

function UploadTab() {
  const [designFile, setDesignFile] = useState(null);
  
  const handleDesignUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setDesignFile(file);
    }
  };
  
  const processDesign = () => {
    if (!designFile) return;
    
    // Process design file (Figma export, Sketch, etc.)
    console.log('Processing design file:', designFile.name);
  };
  
  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Design File Upload</h3>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          accept=".fig,.sketch,.png,.jpg,.jpeg"
          onChange={handleDesignUpload}
          className="hidden"
          id="design-upload"
        />
        <label htmlFor="design-upload" className="cursor-pointer">
          <div className="text-4xl mb-2">🎨</div>
          <div className="text-sm text-gray-600">
            {designFile ? `${designFile.name} selected` : 'Upload design file for comparison'}
          </div>
          <div className="text-xs text-gray-400 mt-2">
            Supports Figma exports, Sketch files, or images
          </div>
        </label>
      </div>
      
      {designFile && (
        <Button onClick={processDesign} className="w-full bg-indigo-600 hover:bg-indigo-700">
          📊 Compare with Current Page
        </Button>
      )}
      
      <div className="text-xs text-gray-500">
        <div className="font-medium mb-1">Coming soon:</div>
        <ul className="space-y-1">
          <li>• Figma API integration</li>
          <li>• Visual diff comparison</li>
          <li>• Pixel-perfect alignment check</li>
        </ul>
      </div>
    </div>
  );
}