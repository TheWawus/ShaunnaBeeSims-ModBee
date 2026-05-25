import React from 'react';
import { getElementDisplayName } from '../../lib/utils';

interface FieldProps {
  label: string;
  description?: string;
  required?: boolean;
  advanced?: boolean;
  children: React.ReactNode;
  [key: string]: any; // Allow other props like key, placeholder etc
}

export function FieldWrapper({ label, description, required, advanced, children }: FieldProps) {
  return (
    <div className="space-y-3 p-6 rounded-[2rem] bg-white border-2 border-[var(--color-border-light)] hover:border-[var(--color-tertiary)] transition-all shadow-sm hover:shadow-md group">
      <div className="flex items-center justify-between">
        <label className="text-xl font-black text-[var(--color-text)] flex items-center gap-2 tracking-tight">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
        {advanced && (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-black rounded-full uppercase tracking-widest border border-yellow-200">
            Advanced
          </span>
        )}
      </div>
      {description && (
        <p className="text-base opacity-50 font-medium leading-relaxed max-w-2xl">{description}</p>
      )}
      <div className="pt-2">
        {children}
      </div>
    </div>
  );
}

export function TextInput({ value, onChange, placeholder, type = 'text', id }: any) {
  return (
    <input
      id={id}
      type={type}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full p-5 bg-[var(--color-bg-primary)] border-4 border-[var(--color-border)] rounded-2xl text-xl font-bold focus:border-[var(--color-tertiary)] outline-none transition-all placeholder:opacity-30"
    />
  );
}

export function TextArea({ value, onChange, placeholder, id }: any) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  return (
    <textarea
      id={id}
      ref={textareaRef}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full min-h-[10rem] p-5 bg-[var(--color-bg-primary)] border-4 border-[var(--color-border)] rounded-2xl text-xl font-bold focus:border-[var(--color-tertiary)] outline-none transition-all resize-none placeholder:opacity-30 overflow-hidden"
    />
  );
}

export function Select({ value, onChange, options, id }: any) {
  return (
    <div id={id} className="relative">
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-5 bg-[var(--color-bg-primary)] border-4 border-[var(--color-border)] rounded-2xl text-xl font-bold focus:border-[var(--color-tertiary)] outline-none transition-all appearance-none pr-12 cursor-pointer"
      >
        {options?.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-2xl opacity-30">
        ▼
      </div>
    </div>
  );
}

export function MultiSelect({ value = [], onChange, options, id }: any) {
  const getAgeIcon = (val: string, isSelected: boolean) => {
    const ageMap: Record<string, string> = {
      'INFANT': 'infant',
      'TODDLER': 'toddler',
      'CHILD': 'child',
      'TEEN': 'teen',
      'YOUNGADULT': 'youngadult',
      'ADULT': 'adult',
      'ELDER': 'elder'
    };
    
    if (ageMap[val]) {
      return `/AGE${ageMap[val]}${isSelected ? 'ON' : 'OFF'}.png`;
    }
    return null;
  };

  return (
    <div id={id} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {options?.map((opt: any) => {
        const isSelected = value.includes(opt.value);
        const ageIcon = getAgeIcon(opt.value, isSelected);

        return (
          <label 
            key={opt.value} 
            className={`
              flex items-center gap-4 p-5 rounded-2xl border-4 transition-all cursor-pointer font-bold text-lg
              ${isSelected 
                ? 'bg-white border-[var(--color-tertiary)] text-[var(--color-tertiary)] shadow-md' 
                : 'bg-[var(--color-bg-primary)] border-[var(--color-border)] opacity-60 hover:opacity-100 hover:border-[var(--color-border-light)]'
              }
            `}
          >
            {ageIcon ? (
              <img 
                src={ageIcon} 
                className={`w-12 h-12 object-contain transition-transform ${opt.value === 'TODDLER' ? 'scale-50' : ''}`} 
                alt={opt.label} 
              />
            ) : (
              <div className={`
                w-8 h-8 rounded-lg border-4 flex items-center justify-center transition-all
                ${isSelected ? 'bg-[var(--color-tertiary)] border-[var(--color-tertiary)]' : 'border-[var(--color-border)]'}
              `}>
                 {isSelected && <span className="text-white text-xl">✓</span>}
              </div>
            )}
            <input
              type="checkbox"
              className="hidden"
              checked={isSelected}
              onChange={(e) => {
                const next = e.target.checked 
                  ? [...value, opt.value]
                  : value.filter((v: string) => v !== opt.value);
                onChange(next);
              }}
            />
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}

export function NumberInput({ value, onChange, placeholder, min, max, step = 1, id }: any) {
  return (
    <input
      id={id}
      type="number"
      value={value ?? ''}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      placeholder={placeholder}
      className="w-full p-5 bg-[var(--color-bg-primary)] border-4 border-[var(--color-border)] rounded-2xl text-xl font-bold focus:border-[var(--color-tertiary)] outline-none transition-all placeholder:opacity-30"
    />
  );
}

export function BooleanToggle({ value, onChange, id }: any) {
  return (
    <button
      id={id}
      onClick={() => onChange(!value)}
      className={`
        w-full p-6 rounded-[2.5rem] border-4 flex items-center justify-between transition-all group
        ${value 
          ? 'bg-white border-[var(--color-tertiary)] shadow-xl' 
          : 'bg-[var(--color-bg-primary)] border-[var(--color-border)] opacity-60 hover:opacity-100'}
      `}
    >
      <div className="flex items-center gap-4">
        <div className={`
          w-14 h-8 rounded-full border-4 relative transition-all
          ${value ? 'bg-[var(--color-tertiary)] border-[var(--color-tertiary)]' : 'bg-gray-200 border-gray-300'}
        `}>
          <div className={`
            absolute top-1 w-4 h-4 rounded-full bg-white transition-all
            ${value ? 'left-8 shadow-md' : 'left-1'}
          `} />
        </div>
        <span className="text-xl font-black uppercase tracking-tight">
          {value ? 'Enabled' : 'Disabled'}
        </span>
      </div>
      <span className="text-3xl opacity-20 group-hover:opacity-100 transition-opacity">
        {value ? '✅' : '❌'}
      </span>
    </button>
  );
}

export function ReferenceSelect({ value, onChange, targetType, state, id }: any) {
  const options = state.elements
    .filter((el: any) => el.type === targetType)
    .map((el: any) => ({
      value: el.id,
      label: getElementDisplayName(el)
    }));

  return (
    <div id={id} className="space-y-4">
      <Select 
        value={value} 
        onChange={onChange} 
        options={[{ value: '', label: `-- Select ${targetType} --` }, ...options]} 
      />
      {options.length === 0 && (
        <p className="text-sm text-amber-600 font-bold px-4">
          ⚠️ No {targetType} elements found in project. Create one first!
        </p>
      )}
    </div>
  );
}
