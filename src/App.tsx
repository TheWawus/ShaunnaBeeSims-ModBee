import React, { useEffect, useState } from 'react';
import { StepShell } from './components/StepShell';
import { initDevTest } from './lib/testHarness';
import { ModProjectProvider, useModProject } from './context/ModProjectContext';
import { Step1TraitName } from './steps/Step1TraitName';
import { Step2TraitGroup } from './steps/Step2TraitGroup';
import { Step3AddBuff } from './steps/Step3AddBuff';
import { Step4Review } from './steps/Step4Review';
import { Step5Building } from './steps/Step5Building';
import { LandingScreen } from './components/LandingScreen';
import { Sidebar } from './components/Sidebar';

import { ELEMENT_SCHEMAS } from './lib/schemas';

import { AutoEditor } from './components/editors/AutoEditor';
import { TdescPanel } from './components/TdescPanel';
import { InteractiveTour, TourMode } from './components/InteractiveTour';
import { ModOrganiser } from './components/ModOrganiser';
import { AnimatePresence } from 'motion/react';

function MainApp() {
  const [view, setView] = useState<'home' | 'editor' | 'organiser'>('home');
  const [step, setStep] = useState(0); 
  const [showTdesc, setShowTdesc] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tourMode, setTourMode] = useState<TourMode>('basic');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const { state, dispatch } = useModProject();

  useEffect(() => {
    initDevTest();
  }, []);

  const handleStart = (initialStep?: number) => {
    setView('editor');
    if (initialStep !== undefined) setStep(initialStep);
    else setStep(0);
  };

  const handleStartTour = (mode: TourMode) => {
    setTourMode(mode);
    setShowTutorial(true);
    setView('editor');
    setStep(0);
  };

  const attemptExit = () => {
    setShowExitConfirm(true);
  };

  const confirmExit = () => {
    dispatch({ type: 'RESET' });
    setShowExitConfirm(false);
    setView('home');
    setShowTutorial(false);
  };

  const renderStep = () => {
    if (view === 'organiser') {
      return <ModOrganiser />;
    }

    // If an element is selected, show its editor regardless of global step (except export)
    if (state.activeElementId && step !== 100) {
      const activeElement = state.elements.find(el => el.id === state.activeElementId);
      if (!activeElement) return <div>Element not found</div>;

      const schema = ELEMENT_SCHEMAS[activeElement.type];
      
      const handleUpdate = (newData: any) => {
        dispatch({ type: 'UPDATE_ELEMENT', payload: { id: activeElement.id, data: newData } });
      };

      const handleRemove = () => {
        dispatch({ type: 'REMOVE_ELEMENT', payload: activeElement.id });
      };

      return (
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Element Header */}
          <div className="flex items-center justify-between p-10 bg-white border-4 border-[var(--color-border-light)] rounded-[3.5rem] shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-tertiary)]/5 rounded-bl-[5rem] -mr-10 -mt-10 group-hover:scale-110 transition-transform" />
            
            <div className="flex items-center gap-8 relative z-10">
              <div className="w-20 h-20 shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                {schema?.icon && (schema.icon.startsWith('/') || schema.icon.includes('.')) ? (
                  <img src={schema.icon} className="w-full h-full object-contain drop-shadow-sm" alt="" />
                ) : (
                  <span className="text-7xl drop-shadow-sm">{schema?.icon || '🧩'}</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="px-3 py-1 bg-[var(--color-tertiary)]/10 text-[var(--color-tertiary)] text-xs font-black rounded-full uppercase tracking-widest border border-[var(--color-tertiary)]/20">
                    {activeElement.type}
                  </span>
                </div>
                <h2 className="text-4xl font-black text-[var(--color-tertiary)] uppercase tracking-tight leading-none mb-2">
                  {activeElement.data.display_name || activeElement.data.buff_name || activeElement.data.name || 'Untitled'}
                </h2>
                <p className="text-sm opacity-40 font-bold uppercase tracking-widest">ID: {activeElement.id.split('_').pop()}</p>
              </div>
            </div>

            <div className="relative z-20">
               <button 
                onClick={handleRemove}
                className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all group/btn flex items-center gap-3"
               >
                 <span className="text-2xl group-hover/btn:rotate-90 transition-transform">✕</span>
                 <span className="text-xs font-black uppercase tracking-widest pr-2">Delete</span>
               </button>
            </div>
          </div>

          <AutoEditor type={activeElement.type} data={activeElement.data} onChange={handleUpdate} />
        </div>
      );
    }

    // Global steps
    switch (step) {
      case 0: return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
           <div className="border-b-4 border-[var(--color-border-light)] pb-6 mb-8">
             <h2 className="text-4xl font-black text-[var(--color-tertiary)] uppercase tracking-tight">Project Identity</h2>
             <p className="text-lg opacity-60 font-medium">Basic information about your mod.</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-2">
               <label className="text-lg font-black text-[var(--color-text)] uppercase tracking-widest">Mod Name</label>
               <input 
                 type="text" 
                 id="tutorial-project-name" value={state.modInfo.displayName}
                 onChange={(e) => dispatch({ type: 'SET_PROJECT_INFO', payload: { displayName: e.target.value, modName: e.target.value.replace(/\s+/g, '') } })}
                 className="w-full p-4 bg-white border-4 border-[var(--color-border)] rounded-2xl text-lg font-bold focus:border-[var(--color-tertiary)] outline-none"
               />
             </div>
             <div className="space-y-2">
               <label className="text-lg font-black text-[var(--color-text)] uppercase tracking-widest">Author</label>
               <input 
                 type="text" 
                 id="tutorial-project-author" value={state.modInfo.author}
                 onChange={(e) => dispatch({ type: 'SET_PROJECT_INFO', payload: { author: e.target.value } })}
                 className="w-full p-4 bg-white border-4 border-[var(--color-border)] rounded-2xl text-lg font-bold focus:border-[var(--color-tertiary)] outline-none"
               />
             </div>
           </div>

           <div className="space-y-2">
               <label className="text-lg font-black text-[var(--color-text)] uppercase tracking-widest">Description</label>
               <textarea 
                 value={state.modInfo.description}
                 onChange={(e) => dispatch({ type: 'SET_PROJECT_INFO', payload: { description: e.target.value } })}
                 className="w-full h-40 p-4 bg-white border-4 border-[var(--color-border)] rounded-2xl text-lg font-bold focus:border-[var(--color-tertiary)] outline-none resize-none"
               />
           </div>
        </div>
      );
      case 100: return <Step5Building />;
      default: return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] opacity-20 text-center">
          <img src="/simscrystal.png" className="w-32 h-32 mb-6 object-contain animate-pulse" alt="" />
          <p className="text-xl font-black uppercase tracking-[0.2em] text-[var(--color-tertiary)]">Select an element to edit</p>
        </div>
      );
    }
  };

  if (view === 'home') {
    return (
      <div className="min-h-screen pt-0 bg-[var(--color-bg-primary)] overflow-x-hidden">
        <LandingScreen 
          onStart={handleStart} 
          onStartTutorial={handleStartTour} 
        />
        {showTutorial && (
          <InteractiveTour mode={tourMode} onClose={() => setShowTutorial(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[var(--color-bg-primary)] overflow-x-hidden">
      <Sidebar 
        currentStep={step} 
        setStep={setStep} 
        onExit={attemptExit} 
        view={view}
        onViewChange={setView}
        onShowTutorial={() => setShowTutorial(true)}
      />
      
      <main className="flex-1 ml-80 flex min-h-screen relative">
        {/* BIIIIIIIG Background Bee */}
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0">
          <img 
            src="/bigbee.png" 
            className="w-[120vw] h-[120vw] max-w-none object-contain opacity-[0.15] -rotate-12 translate-x-1/4 scale-125" 
            alt="" 
          />
        </div>

        <div className={`flex-1 ${state.activeStep === 100 ? 'max-w-[1400px]' : 'max-w-5xl'} mx-auto py-12 px-12 overflow-y-auto min-h-screen relative z-10 transition-all duration-500`}>
          {renderStep()}
        </div>
      </main>

      <AnimatePresence>
        {showTdesc && (
          <TdescPanel onClose={() => setShowTdesc(false)} />
        )}
      </AnimatePresence>

      {showTutorial && (
        <InteractiveTour mode={tourMode} onClose={() => setShowTutorial(false)} />
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white border-[6px] border-rose-400 rounded-[2.5rem] shadow-2xl p-8 space-y-6 text-center">
            <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto shadow-inner mb-2">
              <img src="/warning.png" className="w-16 h-16 object-contain" alt="" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight font-sans">Wait! Unsaved Changes</h3>
            <p className="text-sm font-semibold text-slate-600 leading-relaxed font-sans">
              All progress will be lost. Have you exported your .package file yet?
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black uppercase tracking-wider text-sm rounded-xl transition-all font-sans"
              >
                No, Stay Here
              </button>
              <button
                onClick={confirmExit}
                className="flex-1 py-4 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-wider text-sm rounded-xl shadow-lg transition-all font-sans"
              >
                Yes, Discard All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Tdesc Toggle Button */}
      <button
        onClick={() => setShowTdesc(!showTdesc)}
        className="fixed bottom-8 right-8 z-[120] p-4 bg-[var(--color-tertiary)] hover:bg-[#203a4c] text-white font-black uppercase tracking-wider rounded-full shadow-2xl border-4 border-white flex items-center gap-3 hover:scale-105 active:scale-95 transition-all text-xs"
      >
        <span className="text-lg">📖</span>
        <span>{showTdesc ? 'Close TDESC' : 'TDESC Reference'}</span>
      </button>
    </div>
  );
}

export default function App() {
  return (
    <ModProjectProvider>
      <MainApp />
    </ModProjectProvider>
  );
}

function getTitle(step: number) {
  switch(step) {
    case 1: return "What's the mod called?";
    case 2: return "Choose a Trait Group";
    case 3: return "Add Buffs & Feelings";
    case 4: return "Scripting (Optional)";
    case 5: return "Review Your Mod";
    case 6: return "Building Package...";
    default: return "";
  }
}

function getDescription(step: number) {
  switch(step) {
    case 1: return "Every mod needs a name. This is what players will see in the game.";
    case 2: return "Pick the category that best describes your trait.";
    case 3: return "Buffs give your Sim emotions when they have this trait.";
    case 4: return "Python scripts allow for advanced gameplay logic and overrides.";
    case 5: return "Look over everything to make sure it's perfect.";
    case 6: return "Hold tight! We're making your Sims 4 package right now.";
    default: return "";
  }
}

