import { ReactNode } from 'react';

interface FormFieldProps {
  id: string;
  label: string;
  description?: string;
  error?: string;
  children: ReactNode;
  required?: boolean;
}

export function FormField({
  id,
  label,
  description,
  error,
  children,
  required
}: FormFieldProps) {
  return (
    <div className="mb-8 last:mb-0 text-left">
      <div className="flex items-center gap-2 mb-2">
        <label 
          htmlFor={id} 
          className="text-2xl font-bold text-[var(--color-text)]"
        >
          {label}
        </label>
        {required && (
          <span className="bg-[var(--color-accent)] text-white text-xs px-2 py-1 rounded-md font-bold uppercase tracking-wider">
            Required
          </span>
        )}
      </div>
      
      {description && (
        <p className="text-lg opacity-70 mb-4 font-normal leading-snug">
          {description}
        </p>
      )}
      
      <div className="relative">
        {children}
        {error && (
          <p className="mt-2 text-[var(--color-tertiary)] font-bold text-md flex items-center gap-2">
            <img src="/warning.png" className="w-5 h-5 object-contain" alt="" />
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
