import { useModProject } from '../context/ModProjectContext';

export function Step4Review() {
  const { state, dispatch } = useModProject();

  const moods = [
    { id: '14743011960414179192', label: 'Happy', emoji: '😊' },
    { id: '11440690728873137516', label: 'Energized', emoji: '⚡' },
    { id: '9698589744914228516', label: 'Focused', emoji: '🧠' },
    { id: '5677085783971497974', label: 'Inspired', emoji: '🎨' },
    { id: '17551700494651895360', label: 'Confident', emoji: '😎' },
    { id: '7428682640692576595', label: 'Sad', emoji: '😢' },
    { id: '6720702015291855219', label: 'Angry', emoji: '😡' }
  ];

  return (
    <div className="space-y-8 text-left">
      <div className="bg-white/50 p-6 rounded-2xl border-2 border-[var(--color-border-light)]">
        <h3 className="text-xl font-bold mb-4 opacity-70 flex items-center gap-2">
          <span>🌟</span> The Trait
        </h3>
        <div className="space-y-2">
          <div className="text-3xl font-black text-[var(--color-tertiary)]">{state.traitDisplayName}</div>
          <div className="text-lg italic opacity-80">"{state.traitDescription}"</div>
          <div className="flex gap-2 mt-4">
            <span className="bg-[var(--color-surface-light)] px-4 py-1 rounded-full text-sm font-bold border border-[var(--color-border)]">
              {state.traitGroup}
            </span>
            {state.genderRestriction && (
              <span className="bg-[var(--color-accent)] text-white px-4 py-1 rounded-full text-sm font-bold">
                {state.genderRestriction} Only
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white/50 p-6 rounded-2xl border-2 border-[var(--color-border-light)]">
        <h3 className="text-xl font-bold mb-4 opacity-70 flex items-center gap-2">
          <span>⚡</span> Emotional Buffs ({state.buffs.length})
        </h3>
        {state.buffs.length === 0 ? (
          <div className="text-lg opacity-40 italic">No buffs added yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {state.buffs.map(buff => (
              <div key={buff.name} className="flex items-center gap-3 bg-white/40 p-3 rounded-xl border border-[var(--color-border-light)]">
                <span className="text-2xl">{moods.find(m => m.id === buff.moodType)?.emoji}</span>
                <span className="font-bold flex-1">{buff.name.split('_Buff_')[1]}</span>
                <span className="text-xs opacity-60">+{buff.moodWeight}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-6">
        <label className="block text-xl font-bold mb-3">Mod Filename</label>
        <div className="flex items-center gap-2 bg-[var(--color-surface-light)] p-4 rounded-xl border-2 border-[var(--color-border)]">
          <input
            type="text"
            value={state.modName}
            onChange={(e) => dispatch({ type: 'SET_MOD_NAME', payload: e.target.value })}
            className="bg-transparent text-xl font-mono flex-1 outline-none"
          />
          <span className="text-xl font-mono opacity-40">.package</span>
        </div>
        <p className="mt-2 text-sm opacity-50">This is what the file will be named on your computer.</p>
      </div>
    </div>
  );
}
