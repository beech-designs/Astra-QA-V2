// src/components/TabNav.jsx - Tab Navigation
import React from 'react';

function TabNav({ tabs, activeTab, setActiveTab }) {
  return (
    <div className="flex border-b border-gray-200 bg-gray-50">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 px-3 py-2 text-xs font-medium text-center border-b-2 transition-colors ${
            activeTab === tab.id
              ? 'border-blue-500 text-blue-600 bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          <div className="flex flex-col items-center space-y-1">
            <span className="text-sm">{tab.icon}</span>
            <span>{tab.label}</span>
          </div>
        </button>
      ))}
    </div>
  );
}