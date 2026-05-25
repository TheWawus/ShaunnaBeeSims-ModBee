import { useState } from 'react';
import { useModProject } from '../context/ModProjectContext';
import { FormField } from '../components/FormField';
import { stblKeyFromString } from '../lib/hash';
import { BuffDefinition } from '../types';

export function Step3AddBuff() {
  const { state, dispatch } = useModProject();
  const [showAdd, setShowAdd] = useState(false);

  const [newBuff, setNewBuff] = useState<Partial<BuffDefinition>>({
    moodType: '14743011960414179192', // Happy
    moodWeight: 1,
    durationMinutes: 240,
    iconKey: '2f7d0004:00000000:f3bea58c27e94d40'
  });

  const [names, setNames] = useState({ display: '', desc: '' });

  const moods = [
    { id: '14743011960414179192', label: 'Happy', emoji: '😊' },
    { id: '11440690728873137516', label: 'Energized', emoji: '⚡' },
    { id: '9698589744914228516', label: 'Focused', emoji: '🧠' },
    { id: '5677085783971497974', label: 'Inspired', emoji: '🎨' },
    { id: '17551700494651895360', label: 'Confident', emoji: '😎' },
    { id: '7428682640692576595', label: 'Sad', emoji: '😢' },
    { id: '6720702015291855219', label: 'Angry', emoji: '😡' }
  ];

  const handleAdd = () => {
    if (!names.display) return;
    const buffName = `${state.traitName}_Buff_${names.display.replace(/\s+/g, '')}`;
    
    dispatch({
      type: 'ADD_BUFF',
      payload: {
        ...newBuff,
        name: buffName,
        displayNameHash: stblKeyFromString(names.display),
        descriptionHash: stblKeyFromString(names.desc),
      } as BuffDefinition
    });
    
    setShowAdd(false);
    setNames({ display: '', desc: '' });
  };

  return (
    <div className="space-y-8">
      {!showAdd ? (
        <div className="text-center py-10">
          {state.buffs.length === 0 ? (
            <div className="mb-8">
              <div className="text-6xl mb-4">✨</div>
              <p className="text-xl opacity-60">No buffs added yet. Buffs give your Sim emotions when they have this trait!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 mb-8">
              {state.buffs.map((buff) => (
                <div key={buff.name} className="flex items-center justify-between p-4 bg-white/40 rounded-xl border-2 border-[var(--color-border-light)]">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{moods.find(m => m.id === buff.moodType)?.emoji}</span>
                    <div className="text-left">
                      <div className="font-bold">{buff.name.split('_Buff_')[1]}</div>
                      <div className="text-sm opacity-60">{buff.moodWeight} Intensity • {buff.durationMinutes} mins</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => dispatch({ type: 'REMOVE_BUFF', payload: buff.name })}
                    className="text-[var(--color-tertiary)] font-bold hover:scale-110 transition-transform"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <button
            onClick={() => setShowAdd(true)}
            className="px-10 py-4 bg-[var(--color-accent)] text-white rounded-2xl font-bold text-xl shadow-lg hover:brightness-110 active:scale-95 transition-all"
          >
            + Add New Feeling (Buff)
          </button>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <h2 className="text-2xl font-bold mb-6 text-center">New Buff Details</h2>
          
          <div className="space-y-6">
            <FormField id="buff-name" label="What's this feeling called?" required>
              <input
                type="text"
                value={names.display}
                onChange={(e) => setNames({ ...names, display: e.target.value })}
                placeholder="e.g. Feeling Sprightly"
                className="w-full text-xl p-4 bg-white border-2 border-[var(--color-border)] rounded-xl"
              />
            </FormField>

            <FormField id="buff-desc" label="Description">
              <input
                type="text"
                value={names.desc}
                onChange={(e) => setNames({ ...names, desc: e.target.value })}
                placeholder="e.g. A sudden burst of energy from the night air."
                className="w-full text-xl p-4 bg-white border-2 border-[var(--color-border)] rounded-xl"
              />
            </FormField>

            <FormField id="buff-mood" label="Mood Type">
              <div className="grid grid-cols-4 gap-2">
                {moods.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setNewBuff({ ...newBuff, moodType: m.id })}
                    className={`
                      p-3 rounded-xl border-2 text-sm font-bold transition-all
                      ${newBuff.moodType === m.id 
                        ? 'border-[var(--color-accent)] bg-[var(--color-surface-light)]' 
                        : 'border-[var(--color-border-light)] bg-white/50 opacity-60'
                      }
                    `}
                  >
                    <div>{m.emoji}</div>
                    <div>{m.label}</div>
                  </button>
                ))}
              </div>
            </FormField>

            <div className="flex gap-4 pt-6">
              <button
                onClick={handleAdd}
                disabled={!names.display}
                className="flex-1 py-4 bg-[var(--color-tertiary)] text-white rounded-xl font-bold text-xl disabled:opacity-50"
              >
                Save Feeling
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="px-8 py-4 bg-gray-200 text-gray-600 rounded-xl font-bold text-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
