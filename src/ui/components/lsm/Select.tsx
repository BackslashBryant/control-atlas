import React, { useId } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { label: string; value: string; disabled?: boolean }[];
  helperText?: string;
  error?: string;
}

export function Select({ label, options, helperText, error, id: customId, className = '', ...props }: SelectProps) {
  const generatedId = useId();
  const id = customId || generatedId;
  const helperId = helperText ? `${id}-helper` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

  const selectEl = (
    <div className="relative">
      <select 
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`appearance-none min-h-[44px] w-full px-[12px] pr-[32px] bg-[var(--ca-surface-raised)] text-[var(--ca-text)] border ${
          error ? 'border-[var(--ca-danger)]' : 'border-[var(--ca-border-strong)]'
        } rounded-[3px] focus-visible:outline-2 focus-visible:outline-[var(--ca-primary)] focus-visible:outline-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`} 
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
  
  if (label || helperText || error) {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block mb-[6px] text-[var(--ca-text-muted)] font-mono text-[11px] font-medium uppercase tracking-wider">
            {label}
          </label>
        )}
        {selectEl}
        {error && (
          <p id={errorId} role="alert" className="mt-[6px] text-[var(--ca-danger)] font-mono text-[11px]">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="mt-[6px] text-[var(--ca-text-muted)] text-[11px]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
  
  return selectEl;
}
