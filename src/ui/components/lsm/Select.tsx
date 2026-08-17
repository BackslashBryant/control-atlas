import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { label: string; value: string; disabled?: boolean }[];
}

export function Select({ label, options, className = '', ...props }: SelectProps) {
  const selectEl = (
    <div className="relative">
      <select 
        className={`appearance-none min-h-[44px] w-full px-[12px] pr-[32px] bg-[var(--ca-surface-raised)] text-[var(--ca-text)] border border-[var(--ca-border-strong)] rounded-[3px] focus-visible:outline-2 focus-visible:outline-[var(--ca-primary)] focus-visible:outline-offset-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`} 
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}</option>
        ))}
      </select>
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-[12px] text-[var(--ca-text-muted)]">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>
    </div>
  );
  
  if (label) {
    return (
      <label className="block">
        <span className="block mb-[10px] text-[var(--ca-text-muted)] font-mono text-[10px] uppercase">{label}</span>
        {selectEl}
      </label>
    );
  }
  
  return selectEl;
}
