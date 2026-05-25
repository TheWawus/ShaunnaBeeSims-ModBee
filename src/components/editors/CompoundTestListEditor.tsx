import { FieldWrapper, TextInput } from './SharedFields';
import { ConditionBuilder } from './ConditionBuilder';

export function CompoundTestListEditor({ data, onChange }: any) {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="space-y-6">
        <div className="flex items-center gap-3 px-4">
          <span className="text-3xl">🧩</span>
          <h3 className="text-2xl font-black uppercase tracking-tight opacity-40">Condition Group</h3>
        </div>
        
        <FieldWrapper 
          label="Internal Name" 
          description="A unique name for this logic group."
          required
        >
          <TextInput 
            value={data.name} 
            onChange={(val: string) => onChange({ name: val })} 
            placeholder="e.g. MyMod_IsAdultHappy"
          />
        </FieldWrapper>

        <ConditionBuilder 
          conditions={data.tests || []} 
          onChange={(tests: any[]) => onChange({ tests })} 
        />
      </section>
    </div>
  );
}
