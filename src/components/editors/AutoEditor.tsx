import { ELEMENT_SCHEMAS } from '../../lib/schemas';
import { useModProject } from '../../context/ModProjectContext';
import { FieldWrapper, TextInput, TextArea, Select, MultiSelect, NumberInput, BooleanToggle, ReferenceSelect } from './SharedFields';

export function AutoEditor({ type, data, onChange }: any) {
  const { state } = useModProject();
  const schema = ELEMENT_SCHEMAS[type];

  if (!schema) return <div className="p-12 text-center opacity-30 uppercase font-black tracking-widest">No Schema for {type}</div>;

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
        {schema.fields.map(field => (
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
