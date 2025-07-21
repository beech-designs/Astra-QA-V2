// src/components/PanelWrapper.jsx - Main Panel Container
import React from 'react';
import TabNav from './TabNav';
import AccessibilityTab from './tabs/AccessibilityTab';
import AITab from './tabs/AITab';
import TokenTab from './tabs/TokenTab';
import UploadTab from './tabs/UploadTab';

function PanelWrapper({ activeTab, setActiveTab, pageData, onClose, shadowRoot }) {
  const tabs = [
    { id: 'accessibility', label: 'Accessibility', icon: '♿' },
    { id: 'ai', label: 'AI Analysis', icon: '🤖' },
    { id: 'tokens', label: 'Tokens', icon: '🎨' },
    { id: 'upload', label: 'Design Upload', icon: '📁' }
  ];
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'accessibility':
        return <AccessibilityTab pageData={pageData} />;
      case 'ai':
        return <AITab pageData={pageData} />;
      case 'tokens':
        return <TokenTab pageData={pageData} />;
      case 'upload':
        return <UploadTab />;
      default:
        return <AccessibilityTab pageData={pageData} />;
    }
  };
  
  return (
    <div className="astra-panel">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="text-xl font-bold">✨ Astra</div>
          <div className="text-sm opacity-90">Design QA</div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 text-xl leading-none"
          title="Close panel"
        >
          ×
        </button>
      </div>
      
      {/* Tab Navigation */}
      <TabNav tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {renderTabContent()}
      </div>
    </div>
  );
}