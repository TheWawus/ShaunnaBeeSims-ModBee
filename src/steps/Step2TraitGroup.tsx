import { useModProject } from '../context/ModProjectContext';
import { FormField } from '../components/FormField';

export function Step2TraitGroup() {
  const { state, dispatch } = useModProject();

  const groups = [
    { id: 'PERSONALITY', label: 'Personality', icon: '👤', desc: 'Standard traits shown in CAS' },
    { id: 'LIFESTYLE', label: 'Lifestyle', icon: '🚲', desc: 'Affects how Sims live their life' },
    { id: 'EMOTIONAL', label: 'Emotional', icon: '❤️', desc: 'Affects how Sims feel and react' }
  ] as const;

  return (
    <div className="space-y-10">
      <FormField
        id="trait-group"
        label="Which category does this fit?"
        description="Pick the group that best describes your trait. This is where it will be sorted in the game menus."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => dispatch({ type: 'SET_TRAIT_GROUP', payload: group.id })}
              className={`
                p-6 rounded-2xl border-2 text-left transition-all
                ${state.traitGroup === group.id 
                  ? 'border-[var(--color-accent)] bg-[var(--color-surface-light)] shadow-inner' 
                  : 'border-[var(--color-border-light)] bg-white/50 hover:bg-white'
                }
              `}
            >
              <div className="text-4xl mb-3">{group.icon}</div>
              <div className="text-xl font-bold mb-1">{group.label}</div>
              <div className="text-sm opacity-70">{group.desc}</div>
            </button>
          ))}
        </div>
      </FormField>

      <FormField
        id="gender-pills"
        label="Gender Restriction (Optional)"
        description="Should this trait only appear for certain Sims? Leave unchecked for everyone."
      >
        <div className="flex gap-4">
          {['MALE', 'FEMALE'].map((gender) => (
            <button
              key={gender}
              onClick={() => dispatch({ 
                type: 'SET_GENDER_RESTRICTION', 
                payload: state.genderRestriction === gender ? null : gender as 'MALE' | 'FEMALE' 
              })}
              className={`
                px-8 py-3 rounded-full border-2 font-bold transition-all
                ${state.genderRestriction === gender 
                  ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white' 
                  : 'bg-[var(--color-surface-light)] border-[var(--color-border)] text-[var(--color-text)] opacity-60'
                }
              `}
            >
              {gender === 'MALE' ? '♂️ Male Only' : '♀️ Female Only'}
            </button>
          ))}
        </div>
      </FormField>
    </div>
  );
}
