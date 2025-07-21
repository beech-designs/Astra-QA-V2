// components/ReportViewer.jsx - Report Display Component
import React from 'react';

export default function ReportViewer({ report }) {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'visual-hierarchy': return '📊';
      case 'consistency': return '🔄';
      case 'tokens': return '🎨';
      case 'layout': return '📐';
      case 'accessibility': return '♿';
      default: return '🔍';
    }
  };
  
  return (
    <div className="space-y-8">
      {/* Summary Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Analysis Summary</h2>
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              report.score >= 80 ? 'bg-green-100 text-green-800' :
              report.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              Score: {report.score}/100
            </div>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Page Details</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div><strong>URL:</strong> {report.metadata?.url}</div>
              <div><strong>Title:</strong> {report.metadata?.title}</div>
              <div><strong>Analyzed:</strong> {new Date(report.metadata?.analyzedAt).toLocaleString()}</div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Issue Summary</h3>
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="bg-red-50 p-2 rounded">
                <div className="font-bold text-red-600">
                  {report.issues?.filter(i => i.severity === 'high').length || 0}
                </div>
                <div className="text-red-500">High</div>
              </div>
              <div className="bg-yellow-50 p-2 rounded">
                <div className="font-bold text-yellow-600">
                  {report.issues?.filter(i => i.severity === 'medium').length || 0}
                </div>
                <div className="text-yellow-500">Medium</div>
              </div>
              <div className="bg-blue-50 p-2 rounded">
                <div className="font-bold text-blue-600">
                  {report.issues?.filter(i => i.severity === 'low').length || 0}
                </div>
                <div className="text-blue-500">Low</div>
              </div>
            </div>
          </div>
        </div>
        
        {report.summary && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700">{report.summary}</p>
          </div>
        )}
      </div>
      
      {/* Issues Section */}
      {report.issues && report.issues.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Identified Issues</h2>
          <div className="space-y-4">
            {report.issues.map((issue, index) => (
              <div key={issue.id || index} className={`border rounded-lg p-4 ${getSeverityColor(issue.severity)}`}>
                <div className="flex items-start space-x-3">
                  <span className="text-xl">{getCategoryIcon(issue.category)}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{issue.title}</h3>
                      <span className="text-xs px-2 py-1 rounded capitalize">
                        {issue.severity} • {issue.category}
                      </span>
                    </div>
                    <p className="text-sm mb-3">{issue.description}</p>
                    
                    {issue.elements && issue.elements.length > 0 && (
                      <div className="mb-2">
                        <span className="text-xs font-medium">Affected elements:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {issue.elements.map((element, i) => (
                            <code key={i} className="text-xs bg-black bg-opacity-10 px-2 py-1 rounded">
                              {element}
                            </code>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {issue.recommendation && (
                      <div className="text-sm">
                        <span className="font-medium">💡 Recommendation:</span> {issue.recommendation}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Recommendations Section */}
      {report.recommendations && report.recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Recommendations</h2>
          <div className="space-y-3">
            {report.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                <span className="text-green-600 font-bold">✓</span>
                <div>
                  <div className="font-medium text-green-800">{rec.action}</div>
                  <div className="text-sm text-green-600">{rec.impact}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Positives Section */}
      {report.positives && report.positives.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">What's Working Well</h2>
          <div className="space-y-2">
            {report.positives.map((positive, index) => (
              <div key={index} className="flex items-start space-x-2 text-green-700">
                <span>✨</span>
                <span>{positive}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}