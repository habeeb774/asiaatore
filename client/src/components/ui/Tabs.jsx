import React from 'react';

export function Tabs({ tabs, activeTab, onTabChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #eee', marginBottom: 16 }}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          style={{
            padding: '8px 20px',
            border: 'none',
            borderBottom: activeTab === tab.key ? '3px solid #0ea5a4' : '3px solid transparent',
            background: 'none',
            color: activeTab === tab.key ? '#0ea5a4' : '#444',
            fontWeight: activeTab === tab.key ? 'bold' : 'normal',
            cursor: 'pointer',
            outline: 'none',
            fontSize: 16,
            transition: 'color 0.2s, border-bottom 0.2s'
          }}
        >
          {tab.icon && <span style={{ marginRight: 6 }}>{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
