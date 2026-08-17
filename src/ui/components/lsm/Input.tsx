import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = '', ...props }: InputProps) {
  const inputEl = (
    <input 
      className={`min-h-[44px] w-full px-[12px] bg-[var(--ca-surface-raised)] text-[var(--ca-text)] border border-[var(--ca-border-strong)] rounded-[3px] placeholder:text-[var(--ca-text-muted)] focus-visible:outline-2 focus-visible:outline-[var(--ca-primary)] focus-visible:outline-offset-3 disabled:opacity-50 disabled:cursor-not-allowed ${className}`} 
      {...props} 
    />
  );
  
  if (label) {
    return (
      <label className="block">
        <span className="block mb-[10px] text-[var(--ca-text-muted)] font-mono text-[10px] uppercase">{label}</span>
        {inputEl}
      </label>
    );
  }
  
  return inputEl;
}
