import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'secondary-quiet' | 'destructive' | 'editorial';

const BUTTON_BASE = "inline-flex items-center justify-center min-h-[44px] px-[16px] border rounded-[3px] font-bold uppercase tracking-[0.06em] cursor-pointer transition-colors";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "ca-button-primary",
  secondary: "bg-transparent text-[var(--ca-text)] border-[var(--ca-border-strong)] hover:bg-[color-mix(in_srgb,var(--ca-primary)_13%,transparent)]",
  // Muted twin of `secondary` for de-emphasized actions (e.g. "view source" beside a primary action).
  "secondary-quiet": "bg-transparent text-[var(--ca-text-muted)] border-[color-mix(in_srgb,var(--ca-border-strong)_60%,transparent)] hover:bg-[color-mix(in_srgb,var(--ca-primary)_10%,transparent)] hover:text-[var(--ca-text)]",
  destructive: "bg-[color-mix(in_srgb,var(--ca-danger)_14%,transparent)] text-[var(--ca-danger)] border-[color-mix(in_srgb,var(--ca-danger)_54%,transparent)] hover:bg-[color-mix(in_srgb,var(--ca-danger)_22%,transparent)]",
  editorial: "bg-[var(--ca-editorial)] text-[var(--ca-surface-deep)] border-[var(--ca-editorial)] hover:bg-[color-mix(in_srgb,var(--ca-editorial)_84%,white)]"
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${className}`} {...props} />
  );
}

interface ButtonLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
}

/** For external/navigational links that need button styling — an <a>, never a <button>, so it keeps native link semantics (open-in-new-tab, middle-click, screen-reader "link" role). */
export function ButtonLink({ variant = 'primary', className = '', ...props }: ButtonLinkProps) {
  return (
    <a className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${className}`} {...props} />
  );
}
