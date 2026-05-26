import React, { useState } from 'react';
import { useModProject } from '../context/ModProjectContext';
import { ELEMENT_SCHEMAS } from '../lib/schemas';
import { getElementDisplayName } from '../lib/utils';
import { TypePicker } from './TypePicker';
import { ModEntityType } from '../types';

interface SidebarProps {
  currentStep: number;
  setStep: (step: number) => void;
  onExit: () => void;
  view: 'home' | 'editor' | 'organiser';
  onViewChange: (view: 'home' | 'editor' | 'organiser') => void;
  onShowTutorial: () => void;
}

export function Sidebar({ currentStep, setStep, onExit, view, onViewChange, onShowTutorial }: SidebarProps) {
  const { state, dispatch } = useModProject();
  const [isAdding, setIsAdding] = useState(false);
  const [filterType, setFilterType] = useState<ModEntityType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [showOnlyActive, setShowOnlyActive] = useState(false);

  // Get distinct types from currently created elements
  const createdTypes = Array.from(new Set(state.elements.map(el => el.type)));

  const filteredElements = state.elements.filter(el => {
    const matchesFilterType = filterType === 'ALL' || el.type === filterType;
    const matchesActiveFilter = !showOnlyActive || el.id === state.activeElementId;
    const name = getElementDisplayName(el).toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase()) || el.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilterType && matchesActiveFilter && matchesSearch;
  });

  const handleAddElement = (type: ModEntityType) => {
    const id = `${type}_${Math.random().toString(36).substr(2, 9)}`;
    dispatch({ 
      type: 'ADD_ELEMENT', 
      payload: { 
        id, 
        type, 
        data: {} 
      } 
    });
    dispatch({ type: 'SELECT_ELEMENT', payload: id });
    setStep(1); // Ensure we are on the editor step
    setIsAdding(false);
  };

  const handleRemoveElement = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dispatch({ type: 'REMOVE_ELEMENT', payload: id });
  };

  return (
    <>
      <aside className="w-80 h-screen bg-white border-r-4 border-[var(--color-border-light)] flex flex-col fixed left-0 top-0 z-50">
        {/* Header */}
        <div className="p-6 border-b-4 border-[var(--color-border-light)] bg-[var(--color-bg-primary)]/30">
          <div className="flex items-center gap-3 mb-1">
            <img src="/bee.png" className="w-8 h-8 object-contain" alt="" />
            <h1 className="text-2xl font-black text-[var(--color-tertiary)] uppercase tracking-tighter shrink-0">ModBee</h1>
          </div>
          <div className="h-8 flex items-start">
            <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.15em] break-words leading-tight line-clamp-2 w-full">{state.modInfo.displayName || 'Untitled Mod'}</p>
          </div>
        </div>

        {/* Global Steps */}
        <nav className="p-6 space-y-2">
          <button 
            onClick={onShowTutorial}
            className="w-full p-4 rounded-2xl flex items-center gap-4 transition-all font-black uppercase text-sm tracking-widest hover:bg-amber-50 text-amber-600 border-2 border-transparent hover:border-amber-200"
          >
            <img src="/learn.png" className="w-6 h-6 object-contain" alt="" />
            Guide
          </button>

          <button 
            onClick={() => {
              setStep(0);
              onViewChange('editor');
              dispatch({ type: 'SELECT_ELEMENT', payload: undefined });
            }}
            className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all font-black uppercase text-sm tracking-widest ${(currentStep === 0 && view === 'editor' && !state.activeElementId) ? 'bg-[var(--color-tertiary)] text-white shadow-lg scale-[1.02]' : 'hover:bg-gray-50 opacity-60'}`}
          >
            <img src="/project.png" className="w-6 h-6 object-contain" alt="" />
            Project Info
          </button>

          <button 
            onClick={() => {
              onViewChange('organiser');
              dispatch({ type: 'SELECT_ELEMENT', payload: undefined });
            }}
            className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all font-black uppercase text-sm tracking-widest ${view === 'organiser' ? 'bg-[var(--color-tertiary)] text-white shadow-lg scale-[1.02]' : 'hover:bg-gray-50 opacity-60'}`}
          >
            <img src="/gears.png" className="w-6 h-6 object-contain" alt="" />
            Mod Organiser
          </button>

          <div className="pt-4 border-t-2 border-dashed border-gray-100 mt-4">
            <button 
              id="tutorial-add-element-btn"
              onClick={() => setIsAdding(true)}
              className="w-full p-4 rounded-2xl border-4 border-dashed border-[var(--color-border)] flex items-center gap-4 hover:border-[var(--color-tertiary)] hover:bg-white transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-[var(--color-bg-primary)] group-hover:bg-[var(--color-tertiary)] flex items-center justify-center text-lg group-hover:text-white transition-all">
                +
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-50 group-hover:opacity-100">Add Element</span>
            </button>
          </div>
        </nav>

        {/* Elements List */}
        <div className="flex-1 overflow-y-auto px-6 py-2 pb-10 space-y-6 custom-scrollbar">
          <div className="space-y-4 px-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="/career.png" className="w-4 h-4 opacity-70 object-contain" alt="" />
                <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-30">Your Elements</h3>
              </div>
              <span className="text-xs font-black opacity-30 bg-gray-100 px-2 py-1 rounded-full">{state.elements.length}</span>
            </div>
            
            {/* Search Input */}
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg opacity-30 group-focus-within:opacity-100 transition-opacity">🔍</span>
              <input 
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[var(--color-bg-primary)] border-4 border-transparent focus:border-[var(--color-tertiary)] focus:bg-white rounded-2xl text-sm font-bold outline-none transition-all placeholder:opacity-30"
              />
            </div>

            {/* Filter Chips - Only show types that exist */}
            <div className="space-y-3">
              {createdTypes.length > 0 && (
                <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <button
                    onClick={() => setFilterType('ALL')}
                    className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border-2 transition-all ${filterType === 'ALL' ? 'bg-[var(--color-tertiary)] border-[var(--color-tertiary)] text-white' : 'bg-white border-[var(--color-border-light)] opacity-50 hover:opacity-100'}`}
                  >
                    All
                  </button>
                  {createdTypes.map(type => (
                    <button
                      key={type as string}
                      onClick={() => setFilterType(type as ModEntityType)}
                      className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border-2 transition-all ${filterType === type ? 'bg-[var(--color-tertiary)] border-[var(--color-tertiary)] text-white' : 'bg-white border-[var(--color-border-light)] opacity-50 hover:opacity-100'}`}
                    >
                      {ELEMENT_SCHEMAS[type as ModEntityType]?.label || (type as string)}
                    </button>
                  ))}
                </div>
              )}

              {state.activeElementId && (
                <button
                  onClick={() => setShowOnlyActive(!showOnlyActive)}
                  className={`w-full p-2 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] border-2 transition-all flex items-center justify-center gap-2 ${showOnlyActive ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-white border-gray-100 opacity-40 hover:opacity-100'}`}
                >
                  {showOnlyActive ? '👁️ Showing Selected Only' : '🔍 Solo Selected Element'}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {filteredElements.length > 0 ? (
              filteredElements.map(el => {
                const schema = ELEMENT_SCHEMAS[el.type];
                const isActive = state.activeElementId === el.id;
                const isInjected = state.links?.some(l => l.source === el.id || l.source.includes(el.id.split('_')[1]));
                return (
                  <div key={el.id} className="relative group">
                    <button
                      onClick={() => {
                        onViewChange('editor');
                        dispatch({ type: 'SELECT_ELEMENT', payload: el.id });
                        setStep(1);
                      }}
                      className={`w-full p-5 rounded-3xl flex items-start gap-4 transition-all relative overflow-hidden text-left border-4 ${isActive ? 'bg-white border-[var(--color-tertiary)] shadow-xl scale-[1.02]' : 'bg-[var(--color-bg-primary)] border-transparent hover:border-[var(--color-border-light)]'}`}
                    >
                      <div className="w-10 h-10 shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform">
                        {schema?.icon && (schema.icon.startsWith('/') || schema.icon.includes('.')) ? (
                          <img src={schema.icon} className="w-full h-full object-contain" alt="" />
                        ) : (
                          <span className="text-3xl">{schema?.icon || '🧩'}</span>
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden pr-6">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40">{el.type}</p>
                          {isInjected && (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[8px] font-black uppercase rounded-full tracking-widest border border-blue-200" title="Automatically injected via .ts4script">
                              Injected
                            </span>
                          )}
                        </div>
                        <p className={`font-black uppercase tracking-tight truncate ${isActive ? 'text-[var(--color-tertiary)]' : 'text-gray-600'}`}>
                          {getElementDisplayName(el)}
                        </p>
                      </div>
                    </button>
                    
                    {/* Delete Button - Using a wrapper div to ensure click zone is clean */}
                    <div className="absolute top-2 right-2 z-30 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => handleRemoveElement(e, el.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-600 border-2 border-red-200 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm"
                        title="Delete Element"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 opacity-20 italic text-sm font-bold">
                {state.elements.length === 0 ? 'No elements yet' : 'No matches found'}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t-4 border-[var(--color-border-light)] space-y-4 bg-white">
          <button 
            id="tutorial-export-mod-btn"
            onClick={() => {
              setStep(100);
              onViewChange('editor');
              dispatch({ type: 'SELECT_ELEMENT', payload: undefined });
            }}
            className={`w-full p-5 rounded-3xl flex items-center justify-center gap-4 transition-all font-black uppercase tracking-widest ${currentStep === 100 ? 'bg-[var(--color-tertiary)] text-white shadow-xl' : 'bg-[var(--color-accent)] text-white shadow-[0_8px_0_0_#9F8D3B] hover:translate-y-[-2px] hover:shadow-[0_10px_0_0_#9F8D3B] active:translate-y-[4px] active:shadow-none'}`}
          >
            <img src="/simscrystal.png" className="w-6 h-6 object-contain" alt="" />
            Export Mod
          </button>
          
          <button 
            onClick={onExit}
            className="w-full py-3 text-xs font-black uppercase tracking-[0.3em] opacity-30 hover:opacity-100 transition-opacity"
          >
            Exit Editor
          </button>
        </div>
      </aside>

      {isAdding && (
        <TypePicker 
          onClose={() => setIsAdding(false)} 
          onSelect={handleAddElement} 
        />
      )}
    </>
  );
}
