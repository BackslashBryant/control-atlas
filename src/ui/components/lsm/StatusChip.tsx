import React from 'react';

type StatusVariant = 'info' | 'success' | 'warning' | 'error' | 'neutral';

interface StatusChipProps {
  status?: StatusVariant;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export function StatusChip({ status = 'neutral', children, className = '', icon }: StatusChipProps) {
  const variants = {
    info: "text-[var(--ca-info)]",
    success: "text-[var(--ca-success)]",
    warning: "text-[var(--ca-warning)]",
    error: "text-[var(--ca-danger)]",
    neutral: "text-[var(--ca-text-muted)]",
  };

  return (
    <span className={`inline-flex items-center min-h-[26px] px-[8px] py-[4px] border border-[var(--ca-border-strong)] rounded-full font-mono text-[9px] uppercase tracking-wider ${variants[status]} ${className}`}>
      {icon ? <span className="mr-[6px]">{icon}</span> : <span className="w-[6px] h-[6px] mr-[6px] rounded-full bg-current" />}
      {children}
    </span>
  );
}
