import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RefreshCw, Smartphone, User, MousePointer2 } from 'lucide-react';

interface SimulationState {
  activeMoodlets: any[];
  notifications: any[];
  traits: any[];
}

export function SimPreview({ element, allElements, onClose }: any) {
  const [loading, setLoading] = useState(true);
  const [simName, setSimName] = useState("Bella Goth");
  const [showPie, setShowPie] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  
  // Local Sim state for the session
  const [simState, setSimState] = useState<SimulationState>({
    activeMoodlets: [],
    notifications: [],
    traits: []
  });

  const MOOD_COLORS: Record<string, string> = {
    'Fine': '#808080', 'Happy': '#00B020', 'Angry': '#E02020', 'Confident': '#20A0FF',
    'Flirty': '#FF40A0', 'Energized': '#FFD000', 'Focused': '#8000FF', 'Inspired': '#00E0E0',
    'Playful': '#FF8000', 'Sad': '#4040A0', 'Tense': '#FF6000', 'Scared': '#804000',
    'Uncomfortable': '#A0A000', 'Bored': '#606060', 'Dazed': '#8080A0', 'Embarrassed': '#FFA0A0'
  };

  const MOOD_EMOJIS: Record<string, string> = {
    'Fine': '😐', 'Happy': '😊', 'Angry': '😡', 'Confident': '😎', 'Flirty': '💋',
    'Energized': '⚡', 'Focused': '🧠', 'Inspired': '🎨', 'Playful': '🤡',
    'Sad': '😢', 'Tense': '😖', 'Scared': '😱', 'Uncomfortable': '🤢',
    'Bored': '🥱', 'Dazed': '🥴', 'Embarrassed': '😳'
  };

  // derived state: Calculate main mood based on weights
  const currentMood = useMemo(() => {
    if (simState.activeMoodlets.length === 0) return { name: 'Fine', weight: 0 };
    
    const totals: Record<string, number> = {};
    simState.activeMoodlets.forEach(m => {
      totals[m.mood] = (totals[m.mood] || 0) + m.weight;
    });

    let bestMood = 'Fine';
    let maxWeight = 0;

    Object.entries(totals).forEach(([mood, weight]) => {
      if (weight > maxWeight) {
        maxWeight = weight;
        bestMood = mood;
      }
    });

    return { name: bestMood, weight: maxWeight };
  }, [simState.activeMoodlets]);

  const initSimulation = () => {
    setLoading(true);
    setTimeout(() => {
      const initialMoodlets = [];
      
      // Start with the current element's effect if it's a Buff
      if (element.type === 'Buff') {
        initialMoodlets.push({
          id: element.id,
          name: element.data?.display_name || element.data?.internal_name || 'Current Buff',
          mood: element.data?.mood_type || 'Happy',
          weight: element.data?.mood_weight || 1,
          isCustom: true
        });
      }

      setSimState({
        activeMoodlets: initialMoodlets,
        notifications: [{
          id: Date.now(),
          title: "Simulation Started",
          body: `Now testing ${element.data?.internal_name || 'Project'}. Click Sim to open Pie Menu.`,
          type: 'info'
        }],
        traits: allElements.filter((el: any) => el.type === 'Trait').slice(0, 3).map((t: any) => ({
          id: t.id,
          name: t.data?.display_name || t.data?.internal_name
        }))
      });
      setLoading(false);
    }, 800);
  };

  useEffect(() => {
    initSimulation();
  }, [element.id]);

  const applyLoot = (lootId: string) => {
    const loot = allElements.find((el: any) => el.id === lootId);
    if (!loot) return;

    if (loot.type === 'LootActionSet') {
      // Handle Buffs
      if (loot.data.buff_ref) {
        const buff = allElements.find((el: any) => el.id === loot.data.buff_ref);
        if (buff) {
          setSimState(prev => {
             const exists = prev.activeMoodlets.find(m => m.id === buff.id);
             if (exists) return prev;
             return {
               ...prev,
               activeMoodlets: [...prev.activeMoodlets, {
                 id: buff.id,
                 name: buff.data.buff_name || buff.data.internal_name,
                 mood: buff.data.mood_type || 'Happy',
                 weight: buff.data.mood_weight || 1,
                 isCustom: true
               }]
             };
          });
        }
      }

      // Handle Traits
      if (loot.data.trait_ref) {
        const trait = allElements.find((el: any) => el.id === loot.data.trait_ref);
        if (trait) {
          setSimState(prev => {
            const exists = prev.traits.find(t => t.id === trait.id);
            if (exists) return prev;
            return {
              ...prev,
              traits: [...prev.traits, {
                id: trait.id,
                name: trait.data.display_name || trait.data.internal_name
              }]
            };
          });
        }
      }

      // Handle Notifications
      if (loot.data.notification_text) {
         setSimState(prev => ({
           ...prev,
           notifications: [{
             id: Date.now(),
             title: "Notification Received",
             body: loot.data.notification_text,
             type: 'custom'
           }, ...prev.notifications].slice(0, 3)
         }));
      }
    }
  };

  const handleInteraction = (item: any) => {
    setShowPie(false);
    setLastAction(item.label);

    // Simulate "Loot" processing after animation
    setTimeout(() => {
      // 1. Process explicit outcome loot (SocialInteraction succeeds)
      if (item.element?.data?.loot_on_success) {
        applyLoot(item.element.data.loot_on_success);
      }
      // Mixer interactions often have loot_on_completion
      if (item.element?.data?.loot_on_completion) {
        applyLoot(item.element.data.loot_on_completion);
      }
      // Super interactions often have outcome_loot
      if (item.element?.data?.outcome_loot) {
        applyLoot(item.element.data.outcome_loot);
      }
      
      // 2. Add completion notification
      const newNotif = {
        id: Date.now(),
        title: "Interaction Complete",
        body: `${simName} performed: ${item.label}.`,
        type: item.isCustom ? 'custom' : 'standard'
      };

      setSimState(prev => ({
        ...prev,
        notifications: [newNotif, ...prev.notifications].slice(0, 3)
      }));
      setLastAction(null);
    }, 1500);
  };

  // Pie Menu Data - Dynamic project-wide scan
  const projectInteractions = useMemo(() => {
    const interactions = allElements.filter((el: any) => 
      ['SocialInteraction', 'MixerInteraction', 'SuperInteraction'].includes(el.type)
    ).map((el: any) => ({
      id: el.id,
      label: el.data?.display_name || el.data?.internal_name,
      icon: '✨',
      isCustom: true,
      element: el
    }));

    // If nothing found, add at least the current one if applicable
    if (interactions.length === 0 && ['SocialInteraction', 'MixerInteraction', 'SuperInteraction'].includes(element.type)) {
       interactions.push({
         id: element.id,
         label: element.data?.display_name || element.data?.internal_name,
         icon: '✨',
         isCustom: true,
         element: { type: element.type, data: element.data }
       });
    }

    return interactions;
  }, [allElements, element]);

  const pieItems = [
    ...projectInteractions.slice(0, 4),
    { label: 'Check Social Media', icon: '📱', isCustom: false },
    { label: 'Go Here', icon: '👣', isCustom: false },
    { label: 'Friendly...', icon: '🤝', isCustom: false },
    { label: 'Humor...', icon: '🤡', isCustom: false }
  ];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />
      
      <div className="relative w-full h-full max-w-7xl flex flex-col pointer-events-none">
        
        {/* TOP HUD: Notifications */}
        <div className="absolute top-12 right-12 w-80 space-y-4 pointer-events-auto">
          <AnimatePresence>
            {simState.notifications.map((n) => (
              <motion.div 
                key={n.id}
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 100, opacity: 0 }}
                className={`p-5 rounded-[2rem] shadow-2xl border-t-8 bg-white/95 backdrop-blur ${
                  n.type === 'custom' ? 'border-amber-400' : 'border-blue-400'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-3 h-3 rounded-full ${n.type === 'custom' ? 'bg-amber-400 animate-pulse' : 'bg-blue-400'}`} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{n.title}</span>
                </div>
                <p className="text-sm font-bold text-slate-800 leading-snug">{n.body}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* BOTTOM HUD: Sim Status Bar */}
        <div className="absolute bottom-12 left-1/2 -track-x-1/2 -translate-x-1/2 w-full max-w-6xl flex items-end gap-2 pointer-events-auto px-12">
          
          {/* Portrait Widget */}
          <div className="relative group shrink-0">
             <div 
               className="w-40 h-40 rounded-[3rem] overflow-hidden border-8 border-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative transition-all duration-500 group-hover:scale-105"
               style={{ backgroundColor: MOOD_COLORS[currentMood.name] || '#808080' }}
             >
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <User size={80} className="text-white/30 transform translate-y-4 group-hover:translate-y-2 transition-transform duration-700" />
                </div>
                {/* Mood Emoji Badge */}
                <div className="absolute top-4 right-4 w-12 h-12 bg-white/90 backdrop-blur rounded-2xl flex items-center justify-center text-2xl shadow-lg border-2 border-white group-hover:rotate-12 transition-transform">
                   {MOOD_EMOJIS[currentMood.name]}
                </div>
             </div>
             
             {/* Dynamic Mood Label */}
             <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/95 backdrop-blur px-6 py-2 rounded-full shadow-xl border-4 border-white">
                <span className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: MOOD_COLORS[currentMood.name] }}>
                  {currentMood.name} +{currentMood.weight}
                </span>
             </div>
          </div>

          {/* Buff Tray Area */}
          <div className="flex-1 bg-white/10 backdrop-blur-sm p-4 rounded-[2.5rem] border-4 border-white/20 flex flex-col gap-3 min-h-[120px]">
             <div className="flex gap-2 min-h-[56px] items-center">
                {simState.activeMoodlets.length === 0 ? (
                  <div className="px-6 py-3 bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40 italic">
                    Feeling fine... No active moodlets.
                  </div>
                ) : (
                  simState.activeMoodlets.map((m, i) => (
                    <motion.div 
                      key={`${m.id}-${i}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-xl border-4 border-white ring-4 transition-all hover:scale-110 cursor-help ${
                        m.isCustom ? 'ring-amber-400/50' : 'ring-transparent'
                      }`}
                      style={{ backgroundColor: MOOD_COLORS[m.mood] }}
                      title={`${m.name} (+${m.weight} ${m.mood})`}
                    >
                      {MOOD_EMOJIS[m.mood]}
                    </motion.div>
                  ))
                )}
             </div>

             {/* Traits Row */}
             <div className="flex flex-wrap gap-2">
                {simState.traits.map(t => (
                  <div key={t.id} className="px-4 py-1.5 bg-white/90 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-700 shadow-sm border border-slate-100 flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-blue-400" />
                     {t.name}
                  </div>
                ))}
             </div>
          </div>

          {/* Authentic Needs Panel */}
          <div className="w-48 bg-white/10 backdrop-blur-sm p-4 rounded-[2.5rem] border-4 border-white/20 flex flex-col gap-2 shrink-0">
             {[
               { label: 'Hunger', color: 'bg-green-500', w: 'w-[85%]' },
               { label: 'Energy', color: 'bg-green-500', w: 'w-[90%]' },
               { label: 'Social', color: 'bg-amber-400', w: 'w-[45%]' },
               { label: 'Fun', color: 'bg-green-500', w: 'w-[70%]' }
             ].map(need => (
               <div key={need.label} className="space-y-1">
                 <div className="flex justify-between items-center px-1">
                    <span className="text-[7px] font-black uppercase text-white/60 tracking-widest">{need.label}</span>
                 </div>
                 <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
                    <div className={`h-full ${need.color} ${need.w} rounded-full`} />
                 </div>
               </div>
             ))}
          </div>

          {/* Interaction Queue */}
          <div className="w-64 h-40 bg-slate-900/60 backdrop-blur-md rounded-[2.5rem] border-4 border-white/20 flex flex-col items-center justify-center relative overflow-hidden group shrink-0">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0,transparent_100%)]" />
             
             {/* Clock Area */}
             <div className="flex flex-col items-center mb-4 border-b border-white/10 w-full pt-2 pb-2">
                <span className="text-[10px] font-black text-white/40 tracking-widest uppercase">Mon. 10:42 AM</span>
                <div className="flex gap-1 mt-1">
                   <div className="w-4 h-1 bg-white/20 rounded-full" />
                   <div className="w-4 h-1 bg-green-500 rounded-full shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                   <div className="w-4 h-1 bg-white/20 rounded-full" />
                   <div className="w-4 h-1 bg-white/20 rounded-full" />
                </div>
             </div>

             <div className="flex-1 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {lastAction ? (
                    <motion.div 
                      key="action"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      className="flex flex-col items-center gap-1 z-10"
                    >
                      <div className="w-8 h-8 rounded-full border-4 border-amber-400 border-t-transparent animate-spin mb-1" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 text-center px-4">
                          {lastAction}
                      </span>
                    </motion.div>
                  ) : (
                    <motion.div 
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center gap-1 opacity-20"
                    >
                        <Smartphone size={24} className="text-white" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-white">Queue Empty</span>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
          </div>
        </div>

        {/* CENTER STAGE: The Interactive Sim */}
        <div className="flex-1 flex items-center justify-center relative">
          
          {/* Dynamic Background Stage */}
          <motion.div 
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute rounded-full w-[800px] h-[800px] blur-[150px]"
            style={{ backgroundColor: MOOD_COLORS[currentMood.name] || '#FFFFFF' }}
          />

          <div className="relative pointer-events-auto">
            {loading ? (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 border-[10px] border-white/10 border-t-white rounded-full animate-spin mx-auto shadow-2xl" />
                <p className="text-white text-sm font-black uppercase tracking-[0.5em] opacity-40">Reticulating Splines</p>
              </div>
            ) : (
              <div className="relative">
                {/* Plumbob - Floating & Spinning */}
                <motion.div 
                  animate={{ 
                    rotateY: 360,
                    y: [0, -25, 0]
                  }}
                  transition={{ 
                    rotateY: { duration: 5, repeat: Infinity, ease: "linear" },
                    y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                  }}
                  className="absolute -top-[220px] left-1/2 -translate-x-1/2 w-14 h-28 z-50 filter drop-shadow-[0_0_25px_rgba(255,255,255,0.7)]"
                >
                  <svg viewBox="0 0 100 200" className="w-full h-full">
                    <path 
                      d="M50 0 L100 100 L50 200 L0 100 Z" 
                      fill={MOOD_COLORS[currentMood.name] || '#00FF00'} 
                      stroke="rgba(255,255,255,0.9)" 
                      strokeWidth="8"
                    />
                    <path d="M50 0 L50 200" stroke="rgba(0,0,0,0.1)" strokeWidth="2" />
                    <path d="M0 100 L100 100" stroke="rgba(0,0,0,0.1)" strokeWidth="2" />
                  </svg>
                </motion.div>

                {/* The Sim Mockup */}
                <motion.div 
                  onClick={() => setShowPie(!showPie)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative group cursor-pointer"
                >
                   {/* Floor Shadow */}
                   <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-48 h-8 bg-black/40 blur-2xl rounded-full" />
                   
                   <div className="w-64 h-[450px] relative flex flex-col items-center justify-end">
                      {/* Abstract Sim Figure */}
                      <div className="w-32 h-32 rounded-full bg-white/15 backdrop-blur-2xl border-4 border-white/40 mb-3 shadow-[0_0_50px_rgba(255,255,255,0.1)]" />
                      <div className="w-48 h-80 bg-white/15 backdrop-blur-2xl border-4 border-white/40 rounded-t-[6rem] rounded-b-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.2)]" />
                      
                      {/* Visual Indicator of Clickable area */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <div className="bg-white/95 text-slate-900 border-4 border-white px-10 py-4 rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] shadow-[0_25px_50px_rgba(0,0,0,0.3)]">
                            Options
                         </div>
                      </div>
                   </div>
                </motion.div>

                {/* PIE MENU SYSTEM */}
                <AnimatePresence>
                  {showPie && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] pointer-events-none">
                       {/* Background Shield */}
                       <motion.div 
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         exit={{ opacity: 0 }}
                         onClick={(e) => { e.stopPropagation(); setShowPie(false); }}
                         className="absolute inset-0 pointer-events-auto"
                       />
                       
                       {/* Center Indicator */}
                       <motion.div 
                         initial={{ scale: 0 }}
                         animate={{ scale: 1 }}
                         exit={{ scale: 0 }}
                         className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/20 rounded-full border-4 border-white/40 flex items-center justify-center text-white"
                       >
                          <MousePointer2 size={24} />
                       </motion.div>

                       {/* Pie Items Mapping */}
                       {pieItems.map((item, i) => {
                         const angle = (i * (360 / Math.max(1, pieItems.length))) - 90;
                         const distance = 240;
                         const x = Math.cos(angle * (Math.PI / 180)) * distance;
                         const y = Math.sin(angle * (Math.PI / 180)) * distance;

                         return (
                           <motion.button
                             key={i}
                             initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                             animate={{ scale: 1, x, y, opacity: 1 }}
                             exit={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                             whileHover={{ scale: 1.12, zIndex: 100 }}
                             transition={{ type: 'spring', damping: 20, stiffness: 350, delay: i * 0.04 }}
                             onClick={(e) => { e.stopPropagation(); handleInteraction(item); }}
                             className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto group"
                           >
                              <div className={`relative px-10 py-5 rounded-[2.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.2)] border-[6px] transition-all flex flex-col items-center gap-1 min-w-[180px] ${
                                item.isCustom 
                                  ? 'bg-amber-400 border-white text-slate-900 font-black' 
                                  : 'bg-white border-blue-50 text-slate-800 font-bold'
                              }`}>
                                <div className="text-3xl group-hover:rotate-12 group-hover:scale-125 transition-transform duration-500">{item.icon}</div>
                                <div className="text-[11px] uppercase tracking-tighter whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                                   {item.label}
                                </div>
                                
                                {item.isCustom && (
                                   <div className="absolute -top-3 -right-3 bg-slate-900 px-3 py-1 rounded-full border-4 border-white flex items-center gap-1">
                                      <div className="w-1 h-1 bg-amber-400 rounded-full animate-ping" />
                                      <span className="text-[7px] font-black text-white uppercase tracking-widest">TUNING</span>
                                   </div>
                                )}

                                {/* Subtext for outcome preview */}
                                {item.element?.data?.outcome_loot && (
                                   <div className="text-[8px] opacity-40 font-black tracking-widest uppercase mt-1">Has Outcome</div>
                                )}
                              </div>
                           </motion.button>
                         );
                       })}
                    </div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* TOP LEFT: Sim Metadata Hud */}
        <div className="absolute top-12 left-12 flex items-center gap-8 pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-[20px] rounded-[3rem] p-4 flex items-center gap-6 border-8 border-white shadow-2xl pr-12">
            <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl">
               <User size={32} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 leading-none mb-2">Sim Prototype</span>
              <div className="flex items-center gap-4">
                 <input 
                   value={simName}
                   onChange={(e) => setSimName(e.target.value)}
                   className="bg-transparent border-none p-0 text-3xl font-black text-slate-800 outline-none focus:text-blue-600 transition-colors placeholder:opacity-20"
                   placeholder="Enter Name..."
                 />
                 <div className="w-6 h-6 rounded-full bg-green-500 border-4 border-white shadow-sm" />
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-20 h-20 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-3xl hover:bg-red-600 transition-all hover:scale-110 active:scale-95 group border-[8px] border-white"
          >
            <X size={40} className="group-hover:rotate-90 transition-transform duration-500" />
          </button>
        </div>

        {/* REFRESH/RESET BUTTON */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 pointer-events-auto">
           <button 
             onClick={initSimulation}
             className="bg-white/90 backdrop-blur px-8 py-3 rounded-full border-4 border-white shadow-xl flex items-center gap-3 text-slate-600 hover:text-blue-600 hover:scale-105 transition-all group"
           >
              <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-700" />
              <span className="text-xs font-black uppercase tracking-widest leading-none">Reset Sim State</span>
           </button>
        </div>

      </div>
    </div>
  );
}
