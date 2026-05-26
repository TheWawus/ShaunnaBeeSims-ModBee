import { useState } from 'react';
import { ELEMENT_SCHEMAS } from '../../lib/schemas';
import { useModProject } from '../../context/ModProjectContext';
import { FieldWrapper, TextInput, TextArea, Select, MultiSelect, NumberInput, BooleanToggle, ReferenceSelect } from './SharedFields';
import { SimPreview } from '../SimPreview';
import { Play } from 'lucide-react';
import { AnimatePresence } from 'motion/react';

export function AutoEditor({ type, data, onChange }: any) {
  const { state } = useModProject();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const schema = ELEMENT_SCHEMAS[type];
  if (!schema) return <div className="p-12 text-center opacity-30 uppercase font-black tracking-widest">No Schema for {type}</div>;

  let visibleFields = schema.fields.filter(f => !f.advanced || showAdvanced);

  // Context-aware field filtering for LootActionSet
  if (type === 'LootActionSet') {
    const variant = data.variant;
    visibleFields = visibleFields.filter(f => {
      if (f.id === 'internal_name' || f.id === 'variant') return true;
      if (variant === 'buff' || variant === 'buff_removal') {
        return f.id === 'buff_ref';
      }
      if (variant === 'know_trait' || variant === 'remove_trait') {
        return f.id === 'trait_ref';
      }
      if (variant === 'stat_set_max' || variant === 'statistic_change' || variant === 'skill_level_change') {
        return f.id === 'stat_ref' || (f.id === 'amount' && variant !== 'stat_set_max');
      }
      if (variant === 'money') {
        return f.id === 'amount';
      }
      if (variant === 'relationship_bit') {
        return f.id === 'rel_bit_ref';
      }
      if (variant === 'notification') {
        return f.id === 'notification_title' || f.id === 'notification_text';
      }
      return false;
    });
  }

  const hasAdvancedFields = schema.fields.some(f => f.advanced);

  // Helper to find connected elements (for AI context)
  const getConnectedElements = () => {
    const connected: any[] = [];
    Object.values(data).forEach(val => {
      if (typeof val === 'string' && val.includes('_')) {
        const found = state.elements.find(e => e.id === val);
        if (found) connected.push(found);
      } else if (Array.isArray(val)) {
        val.forEach(v => {
          if (typeof v === 'string') {
            const found = state.elements.find(e => e.id === v);
            if (found) connected.push(found);
          }
        });
      }
    });
    return connected;
  };

  const renderField = (field: any) => {
    const value = data[field.id] ?? field.default ?? '';
    const handleChange = (val: any) => onChange({ [field.id]: val });
    const fieldId = `tutorial-field-${field.id}`;

    switch (field.type) {
      case 'textarea':
        return <TextArea id={fieldId} value={value} onChange={handleChange} placeholder={field.placeholder} />;
      case 'string':
        if (field.id.includes('description') || field.id.includes('reason') || field.id.includes('text') || field.id.includes('xml')) {
           return <TextArea id={fieldId} value={value} onChange={handleChange} placeholder={field.placeholder} />;
        }
        return <TextInput id={fieldId} value={value} onChange={handleChange} placeholder={field.placeholder} />;
      case 'integer':
      case 'float':
        return <NumberInput id={fieldId} value={value} onChange={handleChange} placeholder={field.placeholder} step={field.type === 'float' ? 0.1 : 1} />;
      case 'boolean':
        return <BooleanToggle id={fieldId} value={value} onChange={handleChange} />;
      case 'enum':
        return <Select id={fieldId} value={value} onChange={handleChange} options={field.options} />;
      case 'multiEnum':
        return <MultiSelect id={fieldId} value={value || []} onChange={handleChange} options={field.options} />;
      case 'reference':
        return <ReferenceSelect id={fieldId} value={value} onChange={handleChange} targetType={field.targetType} state={state} />;
      case 'resource':
        return (
          <div className="flex items-center gap-4">
            <TextInput id={fieldId} value={value} onChange={handleChange} placeholder="Resource Key (e.g. 0x...)" />
            <button className="px-4 py-2 bg-gray-100 rounded-xl font-bold uppercase text-[10px] opacity-50 hover:opacity-100 transition-opacity whitespace-nowrap">
              Pick Image
            </button>
          </div>
        );
      default:
        return <TextInput id={fieldId} value={value} onChange={handleChange} />;
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="grid grid-cols-1 gap-6">
        {visibleFields.map(field => (
          <FieldWrapper 
            key={field.id}
            label={field.label}
            description={field.description}
            required={field.required}
            advanced={field.advanced}
          >
            {renderField(field)}
          </FieldWrapper>
        ))}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-12 border-t-4 border-dashed border-slate-100">
        <button 
          onClick={() => setShowPreview(true)}
          className="px-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 group"
        >
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform">
             <Play size={18} fill="currentColor" />
          </div>
          Preview in Game
        </button>

        {hasAdvancedFields && (
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-8 py-5 rounded-3xl font-black uppercase text-xs tracking-widest transition-all shadow-lg active:scale-95 border-4 ${
              showAdvanced 
                ? 'bg-slate-800 border-slate-800 text-white hover:bg-slate-900' 
                : 'bg-white border-slate-800 text-slate-800 hover:bg-slate-50'
            }`}
          >
            {showAdvanced ? 'Hide Advanced Settings' : 'Advanced Mode'}
          </button>
        )}
      </div>

      <AnimatePresence>
        {showPreview && (
          <SimPreview 
            element={{ type, data, id: state.activeElementId }} 
            allElements={state.elements}
            onClose={() => setShowPreview(false)} 
          />
        )}
      </AnimatePresence>

      {schema.fields.length === 0 && (
        <div className="p-20 bg-white/40 border-4 border-dashed border-[var(--color-border)] rounded-[3rem] opacity-40 text-center">
           <span className="text-6xl mb-6 block">🚧</span>
           <p className="text-2xl font-black uppercase tracking-widest">
             Advanced fields for {schema.label}<br/>are being mapped...
           </p>
        </div>
      )}
    </div>
  );
}
