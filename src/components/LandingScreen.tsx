import React, { useState } from 'react';
import { useModProject } from '../context/ModProjectContext';
import { parsePackage } from '../lib/dbpf';
import { importFromPackage } from '../lib/importer';
import { ModUpdater } from './ModUpdater';
import JSZip from 'jszip';

interface LandingScreenProps {
  onStart: (step?: number) => void;
  onStartTutorial: (mode: 'basic' | 'advanced') => void;
}

export function LandingScreen({ onStart, onStartTutorial }: LandingScreenProps) {
  const { dispatch } = useModProject();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTutorialPrompt, setShowTutorialPrompt] = useState(false);
  const [showUpdater, setShowUpdater] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const [selectedTourMode, setSelectedTourMode] = useState<'basic' | 'advanced' | null>(null);

  const handleCreateNewClick = () => {
    const shouldSkip = localStorage.getItem('skip_tutorial_prompt') === 'true';
    if (shouldSkip) {
      dispatch({ type: 'RESET' });
      onStart();
    } else {
      setShowTutorialPrompt(true);
    }
  };

  const handleStartSandbox = () => {
    if (dontAskAgain) {
      localStorage.setItem('skip_tutorial_prompt', 'true');
    }
    setShowTutorialPrompt(false);
    dispatch({ type: 'RESET' });
    onStart();
  };

  const handleStartTutorial = (mode: 'basic' | 'advanced') => {
    if (dontAskAgain) {
      localStorage.setItem('skip_tutorial_prompt', 'true');
    }
    setShowTutorialPrompt(false);
    dispatch({ type: 'RESET' });
    onStartTutorial(mode);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setError(null);
    let packageData: ArrayBuffer | null = null;
    let scriptContent: string | undefined = undefined;
    let importedModName = '';

    try {
      console.log('Starting multi-file import...');
      const allResources: any[] = [];
      const allLinks: { source: string; target: string; type: string }[] = [];
      let combinedScriptContent = '';

      for (const file of Array.from(files) as File[]) {
        const name = file.name.toLowerCase();
        if (name.endsWith('.package')) {
          console.log(`Processing package: ${file.name}`);
          const buffer = await file.arrayBuffer();
          try {
             const resources = parsePackage(buffer);
             allResources.push(...resources);
             if (!importedModName) {
                importedModName = file.name.replace(/\.[^/.]+$/, "");
             }
          } catch (e) {
             console.error(`Failed to parse ${file.name}:`, e);
          }
        } else if (name.endsWith('.ts4script')) {
          console.log(`Processing script: ${file.name}`);
          const zip = await JSZip.loadAsync(file as any);
          const pyFiles = Object.values(zip.files).filter(f => f.name.endsWith('.py'));
          for (const pyFile of pyFiles) {
            const content = await pyFile.async('string');
            combinedScriptContent += `\n# --- From ${file.name}/${pyFile.name} ---\n${content}\n`;
            
            // Extract links from Python
            const links = extractInjectionsFromPython(content);
            allLinks.push(...links);
          }
        }
      }

      if (allResources.length > 0) {
        console.log('Total resources collected:', allResources.length);
        
        const imported = importFromPackage(allResources);
        const elements = imported.elements || [];
        console.log('Imported elements count:', elements.length, 'Strings:', imported.stringCount);

        if (elements.length === 0) {
          console.warn('Import resulted in 0 recognized elements. Resources found:', allResources.length);
          setError('Packages parsed correctly but found 0 supported tuning elements (Traits, Buffs, etc.).');
          setIsLoading(false);
          return;
        }

        dispatch({ 
          type: 'LOAD_PROJECT', 
          payload: {
            projectVersion: '1.0',
            modInfo: {
              author: 'ShaunnaBeeSims',
              modName: imported.importedModName || importedModName || 'ImportedMod',
              displayName: imported.importedModName || importedModName || 'Imported Mod',
              version: '1.0.0',
              description: `Imported from ${Array.from(files).length} files. ${elements.length} elements found.`,
              gameVersion: '1.106'
            },
            elements,
            scriptContent: combinedScriptContent || undefined,
            links: allLinks,
            activeElementId: elements[0].id
          }
        });
        
        console.log('Dispatch complete. Elements:', elements.length);
        onStart(1); 
        setIsLoading(false);
        return; 
      } else {
        setError('No .package file found in your selection. Please select at least one .package file.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Import failed:', err);
      setError('Import failed: ' + (err instanceof Error ? err.message : String(err)));
      setIsLoading(false); 
    } 
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-12 animate-in fade-in zoom-in-95 duration-700 relative">
      {/* BIIIIIIIG Background Bee */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0">
        <img 
          src="/bigbee.png" 
          className="w-[120vw] h-[120vw] max-w-none object-contain opacity-[0.15] -rotate-12 translate-x-1/4 scale-125" 
          alt="" 
        />
      </div>

      <header className={`relative z-10 ${isLoading ? 'opacity-50 blur-sm pointer-events-none transition-all' : 'transition-all'}`}>
        <h1 className="text-7xl font-black text-[var(--color-tertiary)] mb-4 tracking-tighter uppercase">
          ModBee <span className="text-[var(--color-accent)]">Mod Builder</span>
        </h1>
        <p className="text-2xl font-medium opacity-60 max-w-2xl mx-auto">
          Professional Sims 4 modding tools designed for creators. 
          Powerful features, clean workflow, neurodivergent-friendly.
        </p>
      </header>

      {error && (
        <div className="w-full max-w-4xl px-4 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-3xl flex items-center gap-4 shadow-sm">
            <span className="text-2xl">⚠️</span>
            <div className="text-left">
              <div className="font-bold uppercase text-xs tracking-wider opacity-60">Import Error</div>
              <div className="font-medium">{error}</div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center gap-6 animate-pulse">
          <div className="w-32 h-32 bg-[var(--color-tertiary)] rounded-full flex items-center justify-center animate-bounce overflow-hidden">
            <img src="/bee.png" className="w-24 h-24 object-contain" alt="Processing" />
          </div>
          <div className="text-3xl font-black text-[var(--color-tertiary)] uppercase tracking-widest">
            Processing Mod...
          </div>
          <p className="opacity-40 font-bold">Unpacking DBPF resources and parsing tuning XMLs</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4 relative z-10">
          {/* Create New Mod */}
          <button
            onClick={handleCreateNewClick}
            className="group relative flex flex-col items-center p-12 bg-white border-4 border-[var(--color-border)] text-[var(--color-text)] rounded-[3rem] shadow-xl hover:border-[var(--color-tertiary)] hover:-translate-y-2 transition-all cursor-pointer"
          >
            <div className="w-24 h-24 bg-[var(--color-bg-primary)] rounded-full flex items-center justify-center mb-6 shadow-inner group-hover:bg-[var(--color-surface-light)] transition-colors overflow-hidden">
              <img src="/CreateNew.png" className="w-16 h-16 object-contain" alt="New" />
            </div>
            <div className="text-3xl font-black mb-3">Create New</div>
            <p className="opacity-60 text-lg leading-relaxed">Start a fresh project from scratch with our wizard.</p>
          </button>

          {/* Import Mod */}
          <div className="relative group">
            <input
              type="file"
              multiple
              accept=".package,.ts4script"
              onChange={handleImport}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center p-12 bg-white border-[4px] border-[var(--color-border)] text-[var(--color-text)] rounded-[3rem] shadow-xl group-hover:border-[var(--color-accent)] group-hover:-translate-y-2 transition-all">
              <div className="w-24 h-24 bg-[var(--color-surface-light)] rounded-full flex items-center justify-center mb-6 shadow-inner overflow-hidden">
                <img src="/import.png" className="w-16 h-16 object-contain" alt="Import" />
              </div>
              <div className="text-3xl font-black mb-3">Import Mod</div>
              <p className="opacity-60 text-lg leading-relaxed">Load direct .package and .ts4script files to edit.</p>
            </div>
          </div>

          {/* Update Your Mods - New Feature */}
          <button
            onClick={() => setShowUpdater(true)}
            className="md:col-span-2 group relative flex items-center gap-10 p-8 bg-white border-4 border-[var(--color-border)] text-[var(--color-text)] rounded-[3rem] shadow-xl hover:border-indigo-400 hover:-translate-y-1 transition-all cursor-pointer"
          >
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center shadow-inner group-hover:bg-indigo-100 transition-colors overflow-hidden shrink-0">
               <img src="/gears.png" className="w-12 h-12 object-contain" alt="Update" />
            </div>
            <div className="text-left">
              <div className="text-2xl font-black mb-1">Update Your Mods</div>
              <p className="opacity-60 text-base leading-relaxed">Batch verify and patch mods for the latest game version.</p>
            </div>
            <div className="ml-auto px-6 py-3 bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg group-hover:scale-105 transition-transform">
               Beta
            </div>
          </button>
        </div>
      )}

      {showUpdater && (
        <ModUpdater onClose={() => setShowUpdater(false)} />
      )}


      <div className="pt-12 text-sm font-bold opacity-30 tracking-widest uppercase relative z-10">
        Neurodivergent-friendly architecture • FNV-Hash automation • DBPF 2.1 Compliant
      </div>

      {showTutorialPrompt && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 text-left">
          <div className="w-full max-w-4xl bg-white border-[8px] border-amber-400 rounded-[4rem] shadow-2xl p-12 space-y-10 relative">
            <div className="flex items-center gap-6">
              <img src="/learn.png" className="w-20 h-20 object-contain" alt="" />
              <div>
                <span className="text-sm text-amber-700 font-extrabold tracking-widest uppercase block mb-1 font-sans">LEARN WHILE CREATING</span>
                <h3 className="text-5xl font-black text-slate-800 uppercase tracking-tight font-sans">Choose Your Path</h3>
              </div>
            </div>

            <p className="text-2xl font-semibold text-slate-600 leading-relaxed font-sans max-w-3xl">
              Would you like to start with an interactive hand-held tutorial, or jump straight into the sandbox?
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <button 
                 onClick={() => handleStartTutorial('basic')}
                 className="p-8 bg-amber-50 border-4 border-amber-100 rounded-[2.5rem] text-left hover:border-amber-400 transition-all group shadow-sm hover:shadow-xl hover:-translate-y-1"
               >
                 <img src="/bee.png" className="w-12 h-12 object-contain mb-3" alt="" />
                 <h4 className="text-2xl font-black text-amber-800 uppercase font-sans">Basic Tutorial</h4>
                 <p className="text-sm text-amber-600 font-bold leading-relaxed font-sans mt-2">Traits, Buffs, and XML Injectors. Quick & Easy for beginners.</p>
               </button>
               <button 
                 onClick={() => handleStartTutorial('advanced')}
                 className="p-8 bg-slate-50 border-4 border-slate-100 rounded-[2.5rem] text-left hover:border-[var(--color-tertiary)] transition-all group shadow-sm hover:shadow-xl hover:-translate-y-1"
               >
                 <img src="/brain.png" className="w-12 h-12 object-contain mb-3" alt="" />
                 <h4 className="text-2xl font-black text-slate-800 uppercase font-sans">Advanced Tutorial</h4>
                 <p className="text-sm text-slate-500 font-bold leading-relaxed font-sans mt-2">Commodities, Decay, Social Mixers, and Complex Radiuses.</p>
               </button>
            </div>

            {/* Cookie/Localstorage opt-out check */}
            <div className="flex flex-col sm:flex-row gap-6 pt-4 font-sans">
              <button
                onClick={handleStartSandbox}
                className="flex-1 py-6 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black uppercase tracking-wider text-sm rounded-2xl transition-all text-center font-sans shadow-md"
              >
                Empty Sandbox (No help)
              </button>
            </div>

            <label className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl cursor-pointer select-none border-2 border-slate-100 hover:bg-slate-100/50 transition-all font-sans">
              <input 
                type="checkbox" 
                checked={dontAskAgain}
                onChange={(e) => setDontAskAgain(e.target.checked)}
                className="w-6 h-6 rounded border-slate-355 text-amber-500 focus:ring-amber-500 cursor-pointer"
              />
              <span className="text-sm font-extrabold text-slate-500 uppercase tracking-wider font-sans">Skip this choice next time (Always use Sandbox)</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Extracts dependency links from Python injection scripts.
 */
function extractInjectionsFromPython(python: string): { source: string; target: string; type: string }[] {
  const links: { source: string; target: string; type: string }[] = [];
  
  // Pattern 1: Simple SNIPPET_ID and MIXER_IDS
  const snippetMatch = python.match(/SNIPPET_ID\s*=\s*(\d+)/);
  const mixerMatch = python.match(/MIXER_IDS\s*=\s*\(([^)]+)\)/);
  if (snippetMatch && mixerMatch) {
    const sId = snippetMatch[1];
    const mIds = mixerMatch[1].split(',').map(s => s.trim().replace(/L$/, '')).filter(Boolean);
    mIds.forEach(mId => {
       links.push({ source: `MixerInteraction_${mId}`, target: `Snippet_${sId}`, type: 'injection' });
    });
  }

  // Pattern 2: INJECTION_MAP = { id: (id, id), ... }
  const mapMatch = python.match(/INJECTION_MAP\s*=\s*\{([\s\S]*?)\}/);
  if (mapMatch) {
    const entries = mapMatch[1].split('\n').map(l => l.trim()).filter(l => l.includes(':'));
    entries.forEach(entry => {
      const parts = entry.split(':');
      if (parts.length >= 2) {
        // Clean up key and values
        const sId = parts[0].trim().replace(/[^0-9]/g, '');
        const mIdsMatch = parts[1].match(/\(([^)]+)\)/);
        if (mIdsMatch) {
          const mIds = mIdsMatch[1].split(',').map(s => s.trim().replace(/L$/, '')).filter(Boolean);
          mIds.forEach(mId => {
             links.push({ source: `MixerInteraction_${mId}`, target: `Snippet_${sId}`, type: 'injection' });
          });
        }
      }
    });
  }

  return links;
}
