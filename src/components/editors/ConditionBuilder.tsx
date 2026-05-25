import { Select, TextInput } from './SharedFields';

const CONDITION_TYPES = [
  { value: 'trait', label: 'Sim has trait', description: 'Checks if Sim has a specific trait' },
  { value: 'buff', label: 'Sim has buff', description: 'Checks if Sim feels something specific' },
  { value: 'mood', label: 'Sim is in mood', description: 'Checks current emotional state' },
  { value: 'age', label: 'Sim age is', description: 'Checks life stage' },
  { value: 'time', label: 'Time of day', description: 'Checks current hour' },
];

export function ConditionBuilder({ conditions = [], onChange }: any) {
  const addCondition = () => {
    onChange([...conditions, { type: 'trait', data: {} }]);
  };

  const updateCondition = (index: number, patch: any) => {
    const next = [...conditions];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const removeCondition = (index: number) => {
    const next = [...conditions];
    next.splice(index, 1);
    onChange(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-4">
        <h4 className="text-sm font-black uppercase tracking-[0.2em] opacity-30">Conditions (All must be true)</h4>
        <button 
          onClick={addCondition}
          className="text-xs font-black text-[var(--color-tertiary)] hover:brightness-110 uppercase tracking-widest"
        >
          + Add Condition
        </button>
      </div>

      <div className="space-y-3">
        {conditions.length === 0 && (
          <div className="p-8 border-4 border-dashed border-[var(--color-border)] rounded-[2rem] text-center opacity-30 italic font-medium">
            No conditions yet. This will always run.
          </div>
        )}
        
        {conditions.map((cond: any, i: number) => (
          <div key={i} className="flex items-start gap-4 p-5 bg-white border-4 border-[var(--color-border-light)] rounded-[2rem] group hover:border-[var(--color-border)] transition-all">
            <div className="w-10 h-10 flex items-center justify-center text-2xl">
              🔍
            </div>
            
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select 
                value={cond.type}
                onChange={(val: string) => updateCondition(i, { type: val })}
                options={CONDITION_TYPES}
              />
              
              <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                {cond.type === 'trait' && (
                  <TextInput 
                    value={cond.data.trait_ref}
                    onChange={(val: string) => updateCondition(i, { data: { ...cond.data, trait_ref: val } })}
                    placeholder="Enter Trait Name"
                  />
                )}
                {cond.type === 'mood' && (
                  <Select 
                    value={cond.data.mood}
                    onChange={(val: string) => updateCondition(i, { data: { ...cond.data, mood: val } })}
                    options={[
                      { value: 'Happy', label: 'Happy' },
                      { value: 'Sad', label: 'Sad' },
                      { value: 'Angry', label: 'Angry' },
                    ]}
                  />
                )}
                {!['trait', 'mood'].includes(cond.type) && (
                   <div className="p-3 opacity-30 italic text-sm">Value field coming soon</div>
                )}
              </div>
            </div>

            <button 
              onClick={() => removeCondition(i)}
              className="w-10 h-10 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 font-bold"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
