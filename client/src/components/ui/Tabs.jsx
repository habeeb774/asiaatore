import React, { useState } from 'react';
import { cn } from '../../lib/utils';

// Enhanced Tabs component supporting both array-driven content and children slots.
const Tabs = ({
  tabs = [],
  defaultTab,
  className,
  activeTab: controlledActive,
  onTabChange,
  children
}) => {
  const initial = defaultTab || (tabs[0] && (tabs[0].id || tabs[0].key));
  const [uncontrolledActive, setUncontrolledActive] = useState(initial);
  const activeTab = controlledActive || uncontrolledActive;

  const activeContent = React.useMemo(() => {
    const active = tabs.find(tab => (tab.id || tab.key) === activeTab);
    return active ? active.content : null;
  }, [activeTab, tabs]);

  return (
    <div className={cn('w-full', className)}>
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
          {tabs.map(tab => {
            const id = tab.id || tab.key;
            return (
              <button
                key={id}
                onClick={() => {
                  if (onTabChange) onTabChange(id);
                  setUncontrolledActive(id);
                }}
                className={cn(
                  'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-150',
                  activeTab === id
                    ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'
                )}
                aria-current={activeTab === id ? 'page' : undefined}
              >
                {tab.icon ? (
                  <span className="inline-flex items-center gap-1">{tab.icon}{tab.label}</span>
                ) : (
                  tab.label
                )}
              </button>
            );
          })}
        </nav>
      </div>
      <div className="py-6">
        {activeContent || renderChildrenContent(children, activeTab)}
      </div>
    </div>
  );
};

function renderChildrenContent(children, activeId) {
  if (!children) return null;
  const arr = React.Children.toArray(children);
  // Allow each child to declare data-tab mapping; fallback to show all if none match.
  const match = arr.find(ch => ch && ch.props && ch.props['data-tab'] === activeId);
  return match || null;
}

export { Tabs }; // named export for compatibility with existing imports
export default Tabs;
