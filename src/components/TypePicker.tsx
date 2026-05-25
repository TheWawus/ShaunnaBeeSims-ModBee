import { ELEMENT_SCHEMAS } from '../lib/schemas';
import { ModEntityType, ElementSchema } from '../types';

interface TypePickerProps {
  onSelect: (type: ModEntityType) => void;
  onClose: () => void;
}

export function TypePicker({ onSelect, onClose }: TypePickerProps) {
  const schemas = Object.values(ELEMENT_SCHEMAS);
  const categories = ['Core', 'Gameplay', 'Social', 'Systems', 'Misc'] as const;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-[var(--color-bg-primary)]/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-[3rem] shadow-2xl border-4 border-[var(--color-border)] flex flex-col animate-in zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="p-8 border-b-4 border-[var(--color-border-light)] flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-4xl font-black text-[var(--color-tertiary)] uppercase tracking-tight">Add Element</h2>
            <p className="text-lg opacity-50 font-medium">Choose what you want to add to your mod.</p>
          </div>
          <button 
            onClick={onClose}
            className="w-14 h-14 rounded-full bg-[var(--color-bg-primary)] border-4 border-[var(--color-border)] flex items-center justify-center text-2xl hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all active:scale-90"
          >
            ✕
          </button>
        </div>

        {/* Categories */}
        <div className="flex-1 overflow-y-auto p-12 space-y-16">
          {categories.map(cat => {
            const items = schemas.filter(s => s.category === cat);
            if (items.length === 0) return null;

            return (
              <section key={cat} className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="h-1 w-12 bg-[var(--color-tertiary)] rounded-full" />
                  <h3 className="text-2xl font-black uppercase tracking-[0.2em] text-[var(--color-tertiary)]">{cat}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map(schema => (
                    <button
                      key={schema.type}
                      id={`tutorial-type-${schema.type}`}
                      onClick={() => onSelect(schema.type)}
                      className="group p-6 bg-[var(--color-bg-primary)] border-4 border-[var(--color-border)] rounded-[2.5rem] text-left hover:bg-white hover:border-[var(--color-tertiary)] hover:shadow-xl transition-all active:scale-95 flex items-start gap-5"
                    >
                      <div className="w-16 h-16 shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        {schema.icon && (schema.icon.startsWith('/') || schema.icon.includes('.')) ? (
                          <img src={schema.icon} className="w-full h-full object-contain" alt="" />
                        ) : (
                          <span className="text-5xl">{schema.icon}</span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xl font-black text-[var(--color-text)] uppercase">{schema.label}</h4>
                        <p className="text-sm opacity-50 font-medium leading-relaxed">
                          {schema.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
