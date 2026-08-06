'use client';

import { useState, createContext, useContext } from 'react';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextType>({
  activeTab: '',
  setActiveTab: () => {},
});

interface TabsProps {
  defaultTab: string;
  children: React.ReactNode;
  className?: string;
}

function Tabs({ defaultTab, children, className = '' }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabListProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

function TabList({ children, className = '', orientation = 'horizontal' }: TabListProps) {
  return (
    <div
      className={`flex ${orientation === 'vertical' ? 'flex-col' : 'flex-row overflow-x-auto'} ${className}`}
      role="tablist"
    >
      {children}
    </div>
  );
}

interface TabTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

function TabTrigger({ value, children, className = '' }: TabTriggerProps) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => setActiveTab(value)}
      className={`px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap min-h-touch min-w-touch ${
        isActive
          ? 'text-cyan border-b-2 border-cyan'
          : 'text-gray-400 hover:text-white'
      } ${className}`}
    >
      {children}
    </button>
  );
}

interface TabContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

function TabContent({ value, children, className = '' }: TabContentProps) {
  const { activeTab } = useContext(TabsContext);
  if (activeTab !== value) return null;
  return (
    <div role="tabpanel" className={className}>
      {children}
    </div>
  );
}

export { Tabs, TabList, TabTrigger, TabContent };
