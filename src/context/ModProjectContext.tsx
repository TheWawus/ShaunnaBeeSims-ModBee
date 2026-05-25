import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { ModProjectState, ModElement, ModProjectInfo } from '../types';

type ModProjectAction =
  | { type: 'SET_PROJECT_INFO'; payload: Partial<ModProjectInfo> }
  | { type: 'ADD_ELEMENT'; payload: ModElement }
  | { type: 'UPDATE_ELEMENT'; payload: { id: string, data: Record<string, any> } }
  | { type: 'REMOVE_ELEMENT'; payload: string }
  | { type: 'SELECT_ELEMENT'; payload: string | undefined }
  | { type: 'SET_SCRIPT_CONTENT'; payload: string }
  | { type: 'LOAD_PROJECT'; payload: ModProjectState }
  | { type: 'RESET' };

const initialState: ModProjectState = {
  projectVersion: '1.0',
  modInfo: {
    author: '',
    modName: 'UntitledMod',
    displayName: 'Untitled Mod',
    version: '1.0.0',
    description: '',
    gameVersion: '1.106'
  },
  elements: [],
  activeElementId: undefined,
  scriptContent: undefined,
};

function modProjectReducer(state: ModProjectState, action: ModProjectAction): ModProjectState {
  switch (action.type) {
    case 'SET_PROJECT_INFO':
      return { ...state, modInfo: { ...state.modInfo, ...action.payload } };
    case 'ADD_ELEMENT':
      return { ...state, elements: [...state.elements, action.payload] };
    case 'UPDATE_ELEMENT':
      return {
        ...state,
        elements: state.elements.map(el => 
          el.id === action.payload.id ? { ...el, data: { ...el.data, ...action.payload.data } } : el
        )
      };
    case 'REMOVE_ELEMENT':
      return { 
        ...state, 
        elements: state.elements.filter(el => el.id !== action.payload),
        activeElementId: state.activeElementId === action.payload ? undefined : state.activeElementId
      };
    case 'SELECT_ELEMENT':
      return { ...state, activeElementId: action.payload };
    case 'SET_SCRIPT_CONTENT':
      return { ...state, scriptContent: action.payload };
    case 'LOAD_PROJECT':
      return { ...action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const ModProjectContext = createContext<{
  state: ModProjectState;
  dispatch: React.Dispatch<ModProjectAction>;
} | undefined>(undefined);

export function ModProjectProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(modProjectReducer, initialState);
  return (
    <ModProjectContext.Provider value={{ state, dispatch }}>
      {children}
    </ModProjectContext.Provider>
  );
}

export function useModProject() {
  const context = useContext(ModProjectContext);
  if (!context) throw new Error('useModProject must be used within ModProjectProvider');
  return context;
}
