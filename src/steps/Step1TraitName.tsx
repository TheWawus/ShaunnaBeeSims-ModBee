import { useModProject } from '../context/ModProjectContext';
import { FormField } from '../components/FormField';

export function Step1TraitName() {
  const { state, dispatch } = useModProject();

  return (
    <div className="space-y-6">
      <FormField
        id="trait-name"
        label="What is your trait called?"
        description="This is the name players will see when they hover over the trait in Create-A-Sim."
        required
      >
        <input
          id="trait-name"
          type="text"
          value={state.traitDisplayName}
          onChange={(e) => {
            dispatch({ type: 'SET_TRAIT_DISPLAY_NAME', payload: e.target.value });
            // Predictably update internal name too
            if (!state.traitName || state.traitName === state.traitDisplayName.replace(/\s+/g, '')) {
              dispatch({ type: 'SET_TRAIT_NAME', payload: e.target.value.replace(/\s+/g, '') });
            }
          }}
          placeholder="e.g. Night Owl"
          className="w-full text-2xl p-4 bg-[var(--color-surface-light)] border-2 border-[var(--color-border)] rounded-xl outline-none focus:border-[var(--color-tertiary)] transition-colors"
        />
      </FormField>

      <FormField
        id="trait-desc"
        label="Write a short description"
        description="Describe what this trait does to a Sim's personality. Keep it brief!"
        required
      >
        <textarea
          id="trait-desc"
          value={state.traitDescription}
          onChange={(e) => dispatch({ type: 'SET_TRAIT_DESCRIPTION', payload: e.target.value })}
          placeholder="e.g. This Sim thives after midnight and struggles in the morning..."
          rows={3}
          className="w-full text-xl p-4 bg-[var(--color-surface-light)] border-2 border-[var(--color-border)] rounded-xl outline-none focus:border-[var(--color-tertiary)] transition-colors resize-none"
        />
      </FormField>

      <div className="pt-4 opacity-50 text-sm italic">
        Internal ID: {state.traitName || "..."}
      </div>
    </div>
  );
}
