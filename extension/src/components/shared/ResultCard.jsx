// src/components/shared/ResultCard.jsx
import React from 'react';

function ResultCard({ type, title, severity, details, element }) {
  const severityConfig = {
    critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: '🚨' },
    serious: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', icon: '⚠️' },
    moderate: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: '⚡' },
    minor: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: 'ℹ️' },
    violation: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: '❌' }
  };
  
  const config = severityConfig[severity] || severityConfig[type] || severityConfig.minor;
  
  return (
    <div className={`${config.bg} ${config.border} border rounded-lg p-3`}>
      <div className="flex items-start space-x-2">
        <span className="text-lg">{config.icon}</span>
        <div className="flex-1">
          <div className={`font-medium ${config.text}`}>{title}</div>
          {details && <div className="text-sm text-gray-600 mt-1">{details}</div>}
          {element && (
            <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
              {element}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}