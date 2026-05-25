import React from 'react';

interface PrimaryButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export function PrimaryButton({
  onClick,
  children,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  className = ''
}: PrimaryButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-[var(--color-tertiary)] text-white hover:brightness-110 shadow-md",
    secondary: "bg-[var(--color-surface-light)] text-[var(--color-text)] border-2 border-[var(--color-border)] hover:bg-[var(--color-border-light)]",
    accent: "bg-[var(--color-accent)] text-white hover:brightness-110 shadow-md"
  };
  
  const sizes = {
    md: "px-8 py-3 text-lg rounded-xl h-[52px]",
    lg: "px-12 py-4 text-xl rounded-2xl h-[64px]"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}
