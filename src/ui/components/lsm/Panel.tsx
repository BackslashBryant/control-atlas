import React from 'react';

interface PanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  children: React.ReactNode;
  overflow?: 'hidden' | 'visible';
}

export function Panel({ title, children, className = '', overflow = 'hidden', ...props }: PanelProps) {
  return (
    <div className={`relative isolate ${overflow === 'hidden' ? 'overflow-hidden' : ''} min-h-[92px] p-[12px] border border-[var(--ca-border-strong)] border-t-[color-mix(in_srgb,var(--ca-primary)_30%,transparent)] bg-[linear-gradient(145deg,var(--ca-surface),color-mix(in_srgb,var(--ca-surface),var(--ca-primary)_4%))] ${className}`} {...props}>
      {/* Texture background */}
      <div className="absolute inset-0 -z-10 pointer-events-none opacity-[0.14] mix-blend-soft-light" 
           aria-hidden="true"
           style={{ 
             background: 'repeating-linear-gradient(0deg,transparent 0 4px,color-mix(in srgb,var(--ca-text),transparent 96%) 5px),radial-gradient(circle,color-mix(in srgb,var(--ca-text),transparent 91%) 0 1px,transparent 1.4px)',
             backgroundSize: 'auto,9px 9px'
           }} 
      />
      
      {title && (
        <b className="block font-display text-[12px] font-bold uppercase mb-[8px]">
          {title}
        </b>
      )}
      
      <div className="text-[var(--ca-text-muted)] text-[13px] leading-relaxed">
        {children}
      </div>
    </div>
  );
}
