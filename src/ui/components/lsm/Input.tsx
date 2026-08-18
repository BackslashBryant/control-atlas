import React, { useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export function Input({ label, helperText, error, id: customId, className = '', ...props }: InputProps) {
  const generatedId = useId();
  const id = customId || generatedId;
  const helperId = helperText ? `${id}-helper` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

  const inputEl = (
    <input 
      id={id}
      aria-invalid={Boolean(error)}
      aria-describedby={describedBy}
      className={`min-h-[44px] w-full px-[12px] bg-[var(--ca-surface-raised)] text-[var(--ca-text)] border ${
        error ? 'border-[var(--ca-danger)]' : 'border-[var(--ca-border-strong)]'
      } rounded-[3px] placeholder:text-[var(--ca-text-muted)] focus-visible:outline-2 focus-visible:outline-[var(--ca-primary)] focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`} 
      {...props} 
    />
  );
  
  if (label || helperText || error) {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block mb-[6px] text-[var(--ca-text-muted)] font-mono text-[11px] font-medium uppercase tracking-wider">
            {label}
          </label>
        )}
        {inputEl}
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
  
  return inputEl;
}
