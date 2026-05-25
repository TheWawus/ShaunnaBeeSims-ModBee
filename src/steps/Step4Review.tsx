import { useModProject } from '../context/ModProjectContext';
import { getElementDisplayName } from '../lib/utils';
import { ELEMENT_SCHEMAS } from '../lib/schemas';

export function Step4Review() {
  const { state, dispatch } = useModProject();

  const traits = state.elements.filter(el => el.type === 'Trait');
  const buffs = state.elements.filter(el => el.type === 'Buff');
  const systems = state.elements.filter(el => ['Commodity', 'LootActionSet', 'ActionTrigger', 'XmlInjectorSnippet'].includes(el.type));
  const interactions = state.elements.filter(el => ['SocialInteraction', 'MixerInteraction', 'SuperInteraction'].includes(el.type));

  const MOOD_EMOJIS: Record<string, string> = {
    'Happy': '😊',
    'Angry': '😡',
    'Confident': '😎',
    'Flirty': '💋',
    'Energized': '⚡',
    'Focused': '🧠',
    'Inspired': '🎨',
    'Playful': '🤡',
    'Sad': '😢',
    'Tense': '😖',
    'Scared': '😱',
    'Uncomfortable': '🤢',
    'Bored': '🥱',
    'Dazed': '🥴',
    'Embarrassed': '😳'
  };

  return (
    <div className="space-y-8 text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[3rem] border-4 border-slate-100 shadow-xl">
          <h3 className="text-xl font-black mb-6 opacity-30 uppercase tracking-widest flex items-center gap-2">
            <span>🌟</span> Primary Traits ({traits.length})
          </h3>
          <div className="space-y-4">
            {traits.length === 0 ? (
               <div className="p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center opacity-40 italic">No traits added</div>
            ) : (
              traits.map(trait => (
                <div key={trait.id} className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-100">
                  <div className="text-xl font-black text-slate-800 uppercase tracking-tight">{getElementDisplayName(trait)}</div>
                  <div className="text-sm opacity-60 font-medium line-clamp-1">{trait.data.trait_description || 'No description'}</div>
                  <div className="flex gap-2 mt-3">
                    <span className="px-3 py-0.5 bg-white rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm">
                      {trait.data.trait_type || 'Personality'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border-4 border-slate-100 shadow-xl">
          <h3 className="text-xl font-black mb-6 opacity-30 uppercase tracking-widest flex items-center gap-2">
            <span>⚡</span> Emotional Buffs ({buffs.length})
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {buffs.length === 0 ? (
               <div className="p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center opacity-40 italic">No buffs added</div>
            ) : (
              buffs.map(buff => (
                <div key={buff.id} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                  <span className="text-3xl">{MOOD_EMOJIS[buff.data.mood_type] || '✨'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-slate-700 uppercase text-sm truncate">{getElementDisplayName(buff)}</div>
                    <div className="text-xs opacity-50 font-bold uppercase tracking-widest">{buff.data.mood_type || 'Moodless'} +{buff.data.mood_weight || 1}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[3rem] border-4 border-slate-100 shadow-xl opacity-80">
          <h3 className="text-xl font-black mb-6 opacity-30 uppercase tracking-widest flex items-center gap-2">
             <span>⚙️</span> Systems & Logic ({systems.length})
          </h3>
          <div className="space-y-3">
            {systems.map(el => (
              <div key={el.id} className="flex items-center gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <img src={ELEMENT_SCHEMAS[el.type]?.icon} className="w-5 h-5 opacity-40" alt="" />
                <span className="text-xs font-black uppercase text-slate-500 truncate">{getElementDisplayName(el)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border-4 border-slate-100 shadow-xl opacity-80">
          <h3 className="text-xl font-black mb-6 opacity-30 uppercase tracking-widest flex items-center gap-2">
             <span>💬</span> Interactions ({interactions.length})
          </h3>
          <div className="space-y-3">
            {interactions.map(el => (
              <div key={el.id} className="flex items-center gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <img src={ELEMENT_SCHEMAS[el.type]?.icon} className="w-5 h-5 opacity-40" alt="" />
                <span className="text-xs font-black uppercase text-slate-500 truncate">{getElementDisplayName(el)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-12 border-t-4 border-dashed border-slate-100">
        <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-4 ml-6">Package Configuration</label>
        <div className="flex items-center gap-4 bg-white p-8 rounded-[3rem] border-4 border-slate-800 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-white text-2xl">📦</div>
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={state.projectName || ''}
              onChange={(e) => dispatch({ type: 'SET_PROJECT_NAME', payload: e.target.value })}
              className="bg-transparent text-3xl font-black uppercase tracking-tight flex-1 outline-none text-slate-800"
              placeholder="MY_COOL_MOD"
            />
            <span className="text-3xl font-black opacity-20 text-slate-800">.package</span>
          </div>
        </div>
        <p className="mt-4 text-sm opacity-40 font-bold uppercase tracking-widest ml-10">Hashing prefix: ShaunnaBee_</p>
      </div>
    </div>
  );
}
