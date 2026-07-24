import React from 'react';

export interface TabOption {
  id: string;
  label: React.ReactNode;
}

interface TabsProps {
  tabs: TabOption[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeId, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex border-b border-[var(--ca-border-strong)] gap-[16px] ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            aria-current={isActive ? "page" : undefined}
            onClick={() => onChange(tab.id)}
            className={`px-[16px] py-[8px] bg-transparent border-0 border-b-2 cursor-pointer transition-colors ${
              isActive 
                ? 'border-[var(--ca-primary)] text-[var(--ca-primary)] font-bold' 
                : 'border-transparent text-[var(--ca-text)] hover:text-[var(--ca-text)] hover:border-[var(--ca-border-strong)]'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
