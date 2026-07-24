import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'editorial';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center min-h-[44px] px-[16px] border rounded-[3px] font-bold uppercase tracking-[0.06em] cursor-pointer transition-colors";
  
  const variants = {
    primary: "bg-[var(--ca-primary)] text-[var(--ca-surface-deep)] border-[var(--ca-primary)] hover:bg-[color-mix(in_srgb,var(--ca-primary)_84%,var(--ca-text))]",
    secondary: "bg-transparent text-[var(--ca-text)] border-[var(--ca-border-strong)] hover:bg-[color-mix(in_srgb,var(--ca-primary)_13%,transparent)]",
    destructive: "bg-[var(--ca-danger)] text-[var(--ca-surface-deep)] border-[var(--ca-danger)] hover:bg-[color-mix(in_srgb,var(--ca-danger)_84%,white)]",
    editorial: "bg-[var(--ca-editorial)] text-[var(--ca-surface-deep)] border-[var(--ca-editorial)] hover:bg-[color-mix(in_srgb,var(--ca-editorial)_84%,white)]"
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props} />
  );
}
