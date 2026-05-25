import { useEffect, useState } from 'react';
import { useModProject } from '../context/ModProjectContext';
import { buildPackage, downloadPackage } from '../lib/dbpf';
import { runExportPipeline } from '../lib/serializers';
import { createTs4Script } from '../lib/scriptGenerator';

export function Step5Building() {
  const { state } = useModProject();
  const [status, setStatus] = useState<'idle' | 'building' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function executeBuild() {
      setStatus('building');
      try {
        // Collect all strings and resources across all elements
        const resources = runExportPipeline(state.elements);

        const pkg = buildPackage(resources);
        downloadPackage(pkg, state.modInfo.modName || 'MyMod');

        // Handle script mod if content exists
        if (state.scriptContent) {
           const scriptPkg = await createTs4Script(state.modInfo.modName, state.scriptContent);
           const blob = new Blob([scriptPkg], { type: 'application/zip' });
           const url = URL.createObjectURL(blob);
           const a = document.createElement('a');
           a.href = url;
           a.download = `${state.modInfo.modName}.ts4script`;
           document.body.appendChild(a);
           a.click();
           document.body.removeChild(a);
        }

        setStatus('done');
      } catch (e: any) {
        console.error(e);
        setError(e.message || 'Unknown error during build');
        setStatus('error');
      }
    }

    executeBuild();
  }, [state]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-12 animate-in fade-in zoom-in-95 duration-700">
      <div className="relative">
        <div className={`w-36 h-36 rounded-full border-8 border-[var(--color-border-light)] border-t-[var(--color-tertiary)] ${status === 'building' ? 'animate-spin' : ''}`} />
        {status === 'done' && (
          <div className="absolute inset-0 flex items-center justify-center text-6xl animate-in zoom-in duration-500">
            ✅
          </div>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center text-6xl animate-in zoom-in duration-500">
            ❌
          </div>
        )}
      </div>

      <div className="text-center space-y-6">
        <h2 className="text-5xl font-black text-[var(--color-tertiary)] uppercase tracking-tight">
          {status === 'building' && 'Baking your mod...'}
          {status === 'done' && 'Mod Ready!'}
          {status === 'error' && 'Baking Failed'}
        </h2>
        <p className="text-2xl font-medium opacity-60 max-w-lg mx-auto leading-relaxed">
          {status === 'building' && "We're assembling all your XML tunings, STBL strings, and binary package files."}
          {status === 'done' && "Your .package file has been generated and downloaded. Time to play!"}
          {status === 'error' && `Oops: ${error}`}
        </p>
      </div>

      {status === 'done' && (
        <div className="p-10 bg-white border-4 border-[var(--color-border)] rounded-[3rem] shadow-xl max-w-2xl w-full">
          <h4 className="text-xl font-black uppercase mb-6 tracking-widest opacity-40 text-center">Installation Guide</h4>
          <div className="space-y-6">
            <div className="flex gap-6 p-4 rounded-2xl hover:bg-[var(--color-bg-primary)] transition-colors">
              <span className="bg-[var(--color-tertiary)] text-white w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0">1</span>
              <div>
                <p className="font-bold text-lg">Locate your Mods Folder</p>
                <p className="opacity-50 font-medium">Documents / Electronic Arts / The Sims 4 / Mods</p>
              </div>
            </div>
            <div className="flex gap-6 p-4 rounded-2xl hover:bg-[var(--color-bg-primary)] transition-colors">
              <span className="bg-[var(--color-tertiary)] text-white w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0">2</span>
              <div>
                <p className="font-bold text-lg">Drop the Files</p>
                <p className="opacity-50 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Move {state.modInfo.modName}.package (and script if applicable) here.</p>
              </div>
            </div>
            <div className="flex gap-6 p-4 rounded-2xl hover:bg-[var(--color-bg-primary)] transition-colors">
              <span className="bg-[var(--color-tertiary)] text-white w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0">3</span>
              <div>
                <p className="font-bold text-lg">Enable In-Game CC</p>
                <p className="opacity-50 font-medium">Check 'Enable Custom Content and Mods' in Game Options.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-10 pt-10 border-t-2 border-[var(--color-border-light)] text-center">
            <button 
              onClick={() => window.location.reload()}
              className="text-lg font-black text-[var(--color-tertiary)] uppercase tracking-widest hover:opacity-70 transition-opacity"
            >
              Start a New Project
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
