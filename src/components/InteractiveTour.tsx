import React, { useState, useEffect, useRef } from 'react';
import { useModProject } from '../context/ModProjectContext';
import { ModEntityType } from '../types';

interface TourStep {
  title: string;
  targetId: string;
  position: 'right' | 'left' | 'top' | 'bottom' | 'center';
  text: string;
  explain: string;
  neurotip: string;
  expectedStateMsg: string;
}

export type TourMode = 'basic' | 'advanced';

export function InteractiveTour({ mode, onClose }: { mode: TourMode; onClose: () => void }) {
  const { state, dispatch } = useModProject();
  const [currentStep, setCurrentStep] = useState(0);
  const highlightRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const prevTargetId = useRef<string | null>(null);
  const currentPos = useRef({ top: 0, left: 0, width: 0, height: 0 });
  const bubblePos = useRef({ top: 0, left: 0 });

  const basicSteps: TourStep[] = [
    {
      title: 'Initialize Mod Brand Identity 🛡️',
      targetId: 'tutorial-project-name',
      position: 'right',
      text: 'First, let’s identify your mod brand! Type "Procrastinator Sim" as your Mod Name and pick an Author moniker.',
      explain: 'Every mod fileset is stamped with your Author name. S4S uses this grouping key to ensure your mod never collides with other creators’ creations.',
      neurotip: '🧠 Simple Block: Think of this as registering your custom brand before building the furniture.',
      expectedStateMsg: 'Mod Name must not be "Untitled Mod"'
    },
    {
      title: 'Add Personality Blueprint 💼',
      targetId: 'tutorial-add-element-btn',
      position: 'right',
      text: 'Click the "+ Add Element" button in the sidebar to view our blueprint catalog.',
      explain: 'A layout is constructed from elements. Traits, Buffs, and Interactions correspond to distinct game tuning templates.',
      neurotip: '🧠 Simple Block: This opens the drawer containing all our building parts.',
      expectedStateMsg: 'Click the "+" button in the left panel'
    },
    {
      title: 'Choose the Trait Blueprint 👤',
      targetId: 'tutorial-type-Trait',
      position: 'right',
      text: 'Select the "Trait" blueprint. This attaches a core character personality trait to your space.',
      explain: 'Trait blocks define Sim traits selectable directly inside Create-A-Sim (CAS) such as age rules, lifestyles, and conflicting traits.',
      neurotip: '🧠 Simple Block: We are picking the Sim’s "brain chip" element.',
      expectedStateMsg: 'Click "Trait" in the popup menu'
    },
    {
      title: 'Customize Trait Display ✏️',
      targetId: 'tutorial-field-display_name',
      position: 'left',
      text: 'Type "Procrastinator" inside the "Display Name" text input in the editor workspace.',
      explain: 'This label is translated into the game\'s STBL string table, generating unique hexadecimal codes automatically behind the scenes.',
      neurotip: '🧠 Simple Block: Set what players will read in Create-A-Sim.',
      expectedStateMsg: 'Type "Procrastinator"'
    },
    {
      title: 'Add Emotional Guilt Buff ❤️',
      targetId: 'tutorial-add-element-btn',
      position: 'right',
      text: 'Now let’s make a custom emotional Moodlet! Click the "+ Add Element" button in the sidebar again.',
      explain: 'Sim personalities trigger moods when doing actions. We want procrastinators to feel tense if they postpone chores!',
      neurotip: '🧠 Simple Block: We are adding a temporary temporary emotional feeling.',
      expectedStateMsg: 'Click "+ Add Element" again'
    },
    {
      title: 'Choose Buff Blueprint ⚡',
      targetId: 'tutorial-type-Buff',
      position: 'right',
      text: 'Select the "Buff" card from the gameplay catalog.',
      explain: 'Buff elements represent the interactive status indicators displayed above the Sim\'s emotional bar indicator in-game.',
      neurotip: '🧠 Simple Block: Select "Buff" to give our Trait dynamic feelings.',
      expectedStateMsg: 'Click "Buff" in the catalog'
    },
    {
      title: 'Name Your Emotional Buff 🎨',
      targetId: 'tutorial-field-buff_name',
      position: 'left',
      text: 'Type "Guilt Trip" as the name for your new emotional Moodlet.',
      explain: 'The name is what players see when they hover over the mood icon in-game. It should be short and descriptive.',
      neurotip: '🧠 Simple Block: This is the title of the feeling.',
      expectedStateMsg: 'Type "Guilt Trip"'
    },
    {
      title: 'Set the Emotion Type ⚡',
      targetId: 'tutorial-field-mood_type',
      position: 'left',
      text: 'Select "Tense" as the active Emotion type.',
      explain: 'The Emotion type determines the color of the moodlet (Orange for Tense) and affects the Sim\'s overall emotional state.',
      neurotip: '🧠 Simple Block: This sets the "flavor" of the feeling.',
      expectedStateMsg: 'Select "Tense"'
    },
    {
      title: 'Set Emotion Weight ⚖️',
      targetId: 'tutorial-field-mood_weight',
      position: 'left',
      text: 'Set the Emotion Weight to "2".',
      explain: 'Weight determines how strong this feeling is. A weight of 2 is a strong emotional push.',
      neurotip: '🧠 Simple Block: This sets the intensity of the feeling.',
      expectedStateMsg: 'Enter "2" for weight'
    },
    {
      title: 'Add Conflict-Free XML Injector Snippet ⭐',
      targetId: 'tutorial-add-element-btn',
      position: 'right',
      text: 'We want Sims to procrastinate on any laptop! Click "+ Add Element" to add an injector snippet.',
      explain: 'Replacing original computer files crashes the game. Snaps cleanly attach options at runtime dynamically!',
      neurotip: '🧠 Simple Block: Open the toolbox for our non-clashing attachment plug.',
      expectedStateMsg: 'Click "+ Add Element" again'
    },
    {
      title: 'Choose XML Injector Snippet 🔌',
      targetId: 'tutorial-type-XmlInjectorSnippet',
      position: 'right',
      text: 'Select "XML Injector Snippet" from our systems drawer.',
      explain: 'XML Injectors append interactive custom behavior to laptops globally without overriding core files.',
      neurotip: '🧠 Simple Block: Choose XML Injector Snippet to link the laptop action.',
      expectedStateMsg: 'Click "XML Injector Snippet" to proceed'
    },
    {
      title: 'Configure Laptop Target ⚙️',
      targetId: 'tutorial-field-injection_type',
      position: 'left',
      text: 'Set Injection Type to "Add to All Computers" (computer_affordance) to inject our action.',
      explain: 'This enables your custom procrastinating choice to instantly display on laptops, computer desks, and modded laptop products.',
      neurotip: '🧠 Simple Block: Connecting our plug into every computer globally.',
      expectedStateMsg: 'Set Injection Type to "Add to All Computers"'
    },
    {
      title: 'Export Mod Package File! 🚀',
      targetId: 'tutorial-export-mod-btn',
      position: 'right',
      text: 'Done! Your mod is beautifully interconnected. Click the large "Export Mod" button!',
      explain: 'This bundles everything into a .package zip file with fully hashed string entries and metadata.',
      neurotip: '🧠 Simple Block: Great job! Hit compile to finalize your brand new mod.',
      expectedStateMsg: 'Press "Export Mod" to finish'
    }
  ];

  const advancedSteps: TourStep[] = [
    {
      title: 'Advanced System Setup 🏗️',
      targetId: 'tutorial-project-name',
      position: 'right',
      text: 'Let’s build the "Drama Queen" system. Set Mod Name to "Social Drama" and Author to your name.',
      explain: 'Advanced systems require strict naming conventions to cross-reference multiple resource types.',
      neurotip: '🧠 Simple Block: We are building a complex web, clarity starts at the name.',
      expectedStateMsg: 'Set Name and Author'
    },
    {
      title: 'Create a Social Mixer 🎓',
      targetId: 'tutorial-add-element-btn',
      position: 'right',
      text: 'Click "+ Add Element" and let’s find the "Social Mixer".',
      explain: 'Social Mixers are the "verbs" in a conversation (e.g., "Tell Dramatic Story"). They are sub-actions.',
      neurotip: '🧠 Simple Block: We are creating a new shared action between Sims.',
      expectedStateMsg: 'Add an Interaction'
    },
    {
      title: 'Choose Social Mixer 🗣️',
      targetId: 'tutorial-type-MixerInteraction',
      position: 'right',
      text: 'Find and select "Social Mixer" in the Social category. This is the heart of your dramatic interaction.',
      explain: 'Mixers hold the animations and outcomes for social-focused mods.',
      neurotip: '🧠 Simple Block: Pick the pulsing card to continue.',
      expectedStateMsg: 'Select Social Mixer'
    },
    {
      title: 'Assign Pie Menu Group 🥧',
      targetId: 'tutorial-field-display_name',
      position: 'left',
      text: 'Set Display Name to "Start Drama".',
      explain: 'Pie Menu Categories organize your custom actions so they don’t clutter the main Sim menu.',
      neurotip: '🧠 Simple Block: Grouping our drama actions for easy finding.',
      expectedStateMsg: 'Name it "Start Drama"'
    },
    {
      title: 'Create Drama Commodity (Decay) ❤️',
      targetId: 'tutorial-add-element-btn',
      position: 'right',
      text: 'We need a resource that drains. Add a "Commodity".',
      explain: 'Commodities track internal states like Hunger, or in our case, "Drama Tension".',
      neurotip: '🧠 Simple Block: This is the Sim’s invisible "Drama Meter".',
      expectedStateMsg: 'Add a Commodity'
    },
    {
      title: 'Choose Commodity 📉',
      targetId: 'tutorial-type-Commodity',
      position: 'right',
      text: 'Select "Commodity" from the systems drawer.',
      explain: 'Commodities allow us to set "Decay" rates—how fast the meter drops over time.',
      neurotip: '🧠 Simple Block: Give the drama a value that changes.',
      expectedStateMsg: 'Select Commodity'
    },
    {
      title: 'Set Decay Rates ⏱️',
      targetId: 'tutorial-field-decay_rate',
      position: 'left',
      text: 'Set Decay Rate to "0.5".',
      explain: 'A 0.5 decay means the tension drops slowly. Socializing manually will "re-fill" it.',
      neurotip: '🧠 Simple Block: Make the tension vanish slowly.',
      expectedStateMsg: 'Set Decay to 0.5'
    },
    {
      title: 'Define Drama Loot Action 💰',
      targetId: 'tutorial-add-element-btn',
      position: 'right',
      text: 'Now add a "Loot Action Set".',
      explain: 'Loots are the "Rewards" or "Consequences" triggered by success or failure in an interaction.',
      neurotip: '🧠 Simple Block: Define what actually happens after the drama.',
      expectedStateMsg: 'Add Loot Action Set'
    },
    {
      title: 'Choose Loot 💰',
      targetId: 'tutorial-type-LootActionSet',
      position: 'right',
      text: 'Select "Loot Action Set" to proceed.',
      explain: 'We will link this to our Interaction to "Add" to our Drama Commodity.',
      neurotip: '🧠 Simple Block: Making the "drama points" dispenser.',
      expectedStateMsg: 'Select Loot Action Set'
    },
    {
      title: 'Link Commodity to Loot 🔗',
      targetId: 'tutorial-field-internal_name',
      position: 'left',
      text: 'Internal Name: "DramaQueen_Loot".',
      explain: 'Behind the scenes, we use this ID to connect the interaction output to the statistic input.',
      neurotip: '🧠 Simple Block: Wiring the "Drama Success" to the "Drama Meter".',
      expectedStateMsg: 'Enter Internal Name'
    },
    {
      title: 'Create Proximity Broadcaster 📡',
      targetId: 'tutorial-add-element-btn',
      position: 'right',
      text: 'Advanced: Add "Broadcaster".',
      explain: 'Broadcasters pulse an effect (Buff) to every Sim within a specific radius.',
      neurotip: '🧠 Simple Block: Creating an "aura" of drama around the Sim.',
      expectedStateMsg: 'Add Broadcaster'
    },
    {
      title: 'Choose Broadcaster 📡',
      targetId: 'tutorial-type-Broadcaster',
      position: 'right',
      text: 'Select "Broadcaster".',
      explain: 'When our Sim gets dramatic, everyone nearby should feel "Awkward"!',
      neurotip: '🧠 Simple Block: Selecting the pulse energy element.',
      expectedStateMsg: 'Select Broadcaster'
    },
    {
      title: 'Set Broadcasting Radius 📏',
      targetId: 'tutorial-field-radius',
      position: 'left',
      text: 'Set Radius to "10".',
      explain: 'A 10-tile radius covers a standard small living room or patio area.',
      neurotip: '🧠 Simple Block: Set how far the drama pulse reaches.',
      expectedStateMsg: 'Set Radius to 10'
    },
    {
      title: 'Final Export 🚀',
      targetId: 'tutorial-export-mod-btn',
      position: 'right',
      text: 'You’ve built a Social Interaction -> Loot -> Commodity -> Broadcaster loop!',
      explain: 'This is a professional-grade gameplay cycle. It affects the world, not just the Sim.',
      neurotip: '🧠 Simple Block: You are now an Advanced Modder. Finalize and test!',
      expectedStateMsg: 'Click Export'
    }
  ];

  const steps = mode === 'basic' ? basicSteps : advancedSteps;
  const activeStep = steps[currentStep];

  // Auto-complete handler to push state
  const handleAutoComplete = () => {
    if (mode === 'advanced') {
      switch (currentStep) {
        case 0:
          dispatch({ type: 'SET_PROJECT_INFO', payload: { displayName: 'Social Drama', author: 'AdvancedBee' } });
          setCurrentStep(1);
          break;
        case 1: document.getElementById('tutorial-add-element-btn')?.click(); setCurrentStep(2); break;
        case 2:
          const interId = 'MixerInteraction_drama';
          dispatch({ type: 'ADD_ELEMENT', payload: { id: interId, type: 'MixerInteraction', data: { display_name: 'Start Drama' } } });
          dispatch({ type: 'SELECT_ELEMENT', payload: interId });
          setCurrentStep(3);
          break;
        case 3:
          const activeInt = state.elements.find(el => el.type === 'MixerInteraction');
          if (activeInt) dispatch({ type: 'UPDATE_ELEMENT', payload: { id: activeInt.id, data: { ...activeInt.data, display_name: 'Start Drama' } } });
          setCurrentStep(4);
          break;
        case 4: document.getElementById('tutorial-add-element-btn')?.click(); setCurrentStep(5); break;
        case 5:
          const statId = 'Commodity_tension';
          dispatch({ type: 'ADD_ELEMENT', payload: { id: statId, type: 'Commodity', data: { internal_name: 'Drama_Tension', decay_rate: 0.5 } } });
          dispatch({ type: 'SELECT_ELEMENT', payload: statId });
          setCurrentStep(6);
          break;
        case 6:
          const activeStat = state.elements.find(el => el.type === 'Commodity');
          if (activeStat) dispatch({ type: 'UPDATE_ELEMENT', payload: { id: activeStat.id, data: { ...activeStat.data, decay_rate: 0.5 } } });
          setCurrentStep(7);
          break;
        case 7: document.getElementById('tutorial-add-element-btn')?.click(); setCurrentStep(8); break;
        case 8:
          const lootId = 'LootActionSet_drama';
          dispatch({ type: 'ADD_ELEMENT', payload: { id: lootId, type: 'LootActionSet', data: { internal_name: 'DramaQueen_Loot' } } });
          dispatch({ type: 'SELECT_ELEMENT', payload: lootId });
          setCurrentStep(9);
          break;
        case 9:
          const activeLoot = state.elements.find(el => el.type === 'LootActionSet');
          if (activeLoot) dispatch({ type: 'UPDATE_ELEMENT', payload: { id: activeLoot.id, data: { ...activeLoot.data, internal_name: 'DramaQueen_Loot' } } });
          setCurrentStep(10);
          break;
        case 10: document.getElementById('tutorial-add-element-btn')?.click(); setCurrentStep(11); break;
        case 11:
          const broadId = 'Broadcaster_aura';
          dispatch({ type: 'ADD_ELEMENT', payload: { id: broadId, type: 'Broadcaster', data: { radius: 10 } } });
          dispatch({ type: 'SELECT_ELEMENT', payload: broadId });
          setCurrentStep(12);
          break;
        case 12:
          const activeBr = state.elements.find(el => el.type === 'Broadcaster');
          if (activeBr) dispatch({ type: 'UPDATE_ELEMENT', payload: { id: activeBr.id, data: { ...activeBr.data, radius: 10 } } });
          setCurrentStep(13);
          break;
        case 13:
          document.getElementById('tutorial-export-mod-btn')?.click();
          onClose();
          break;
      }
      return;
    }

    switch (currentStep) {
      case 0:
        dispatch({ type: 'SET_PROJECT_INFO', payload: { displayName: 'Procrastinator Sim', author: 'CreatorBee' } });
        setCurrentStep(1);
        break;
      case 1: document.getElementById('tutorial-add-element-btn')?.click(); setCurrentStep(2); break;
      case 2:
        const tId = 'Trait_tutorial';
        dispatch({ type: 'ADD_ELEMENT', payload: { id: tId, type: 'Trait', data: { display_name: 'Procrastinator' } } });
        dispatch({ type: 'SELECT_ELEMENT', payload: tId });
        setCurrentStep(3);
        break;
      case 3:
        const aT = state.elements.find(el => el.type === 'Trait');
        if (aT) dispatch({ type: 'UPDATE_ELEMENT', payload: { id: aT.id, data: { ...aT.data, display_name: 'Procrastinator' } } });
        setCurrentStep(4);
        break;
      case 4: document.getElementById('tutorial-add-element-btn')?.click(); setCurrentStep(5); break;
      case 5:
        const bId = 'Buff_tutorial';
        dispatch({ type: 'ADD_ELEMENT', payload: { id: bId, type: 'Buff', data: { buff_name: 'Guilt Trip' } } });
        dispatch({ type: 'SELECT_ELEMENT', payload: bId });
        setCurrentStep(6);
        break;
      case 6:
        const aB = state.elements.find(el => el.type === 'Buff');
        if (aB) dispatch({ type: 'UPDATE_ELEMENT', payload: { id: aB.id, data: { ...aB.data, buff_name: 'Guilt Trip' } } });
        setCurrentStep(7);
        break;
      case 7:
        const aBM = state.elements.find(el => el.type === 'Buff');
        if (aBM) dispatch({ type: 'UPDATE_ELEMENT', payload: { id: aBM.id, data: { ...aBM.data, mood_type: 'Tense' } } });
        setCurrentStep(8);
        break;
      case 8:
        const aBW = state.elements.find(el => el.type === 'Buff');
        if (aBW) dispatch({ type: 'UPDATE_ELEMENT', payload: { id: aBW.id, data: { ...aBW.data, mood_weight: 2 } } });
        setCurrentStep(9);
        break;
      case 9: document.getElementById('tutorial-add-element-btn')?.click(); setCurrentStep(10); break;
      case 10:
        const iId = 'XmlInjectorSnippet_tutorial';
        dispatch({ type: 'ADD_ELEMENT', payload: { id: iId, type: 'XmlInjectorSnippet', data: { injection_type: 'computer_affordance' } } });
        dispatch({ type: 'SELECT_ELEMENT', payload: iId });
        setCurrentStep(11);
        break;
      case 11:
        const aI = state.elements.find(el => el.type === 'XmlInjectorSnippet');
        if (aI) dispatch({ type: 'UPDATE_ELEMENT', payload: { id: aI.id, data: { ...aI.data, injection_type: 'computer_affordance' } } });
        setCurrentStep(12);
        break;
      case 12:
        document.getElementById('tutorial-export-mod-btn')?.click();
        onClose();
        break;
    }
  };

  // Coordinates tracker loop to move tutorial bubble cleanly with elements
  useEffect(() => {
    let firstFrame = true;

    const update = () => {
      const targetId = activeStep.targetId;
      const targetEl = document.getElementById(targetId);
      
      if (targetEl && highlightRef.current && bubbleRef.current) {
        const rect = targetEl.getBoundingClientRect();
        
        // Auto-scroll logic: Only scroll when the step changes to avoid jitter
        if (targetId !== prevTargetId.current) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          prevTargetId.current = targetId;
        }

        // Target Highlight values
        const tTop = rect.top - 12;
        const tLeft = rect.left - 12;
        const tWidth = rect.width + 24;
        const tHeight = rect.height + 24;

        // Target Bubble values
        const margin = 24;
        const bubbleWidth = 550;
        let bTargetTop = 0;
        let bTargetLeft = 0;

        switch (activeStep.position) {
          case 'right':
            bTargetTop = rect.top + rect.height / 2 - 150;
            bTargetLeft = rect.left + rect.width + margin;
            break;
          case 'left':
            bTargetTop = rect.top + rect.height / 2 - 150;
            bTargetLeft = rect.left - bubbleWidth - margin;
            break;
          case 'top':
            bTargetTop = rect.top - 450;
            bTargetLeft = rect.left + rect.width / 2 - bubbleWidth / 2;
            break;
          case 'bottom':
          default:
            bTargetTop = rect.top + rect.height + margin;
            bTargetLeft = rect.left + rect.width / 2 - bubbleWidth / 2;
            break;
        }

        // Clamp bubble to viewport
        const padding = 20;
        const bHeight = bubbleRef.current.offsetHeight || 400;
        bTargetLeft = Math.max(padding, Math.min(bTargetLeft, window.innerWidth - bubbleWidth - padding));
        bTargetTop = Math.max(padding, Math.min(bTargetTop, window.innerHeight - bHeight - padding));

        // Lerp positioning
        const lerp = firstFrame ? 1 : 0.15;
        firstFrame = false;

        currentPos.current = {
          top: currentPos.current.top + (tTop - currentPos.current.top) * lerp,
          left: currentPos.current.left + (tLeft - currentPos.current.left) * lerp,
          width: currentPos.current.width + (tWidth - currentPos.current.width) * lerp,
          height: currentPos.current.height + (tHeight - currentPos.current.height) * lerp,
        };

        bubblePos.current = {
          top: bubblePos.current.top + (bTargetTop - bubblePos.current.top) * lerp,
          left: bubblePos.current.left + (bTargetLeft - bubblePos.current.left) * lerp,
        };

        // Apply Styles
        const h = highlightRef.current;
        h.style.display = 'block';
        h.style.top = `${currentPos.current.top}px`;
        h.style.left = `${currentPos.current.left}px`;
        h.style.width = `${currentPos.current.width}px`;
        h.style.height = `${currentPos.current.height}px`;

        const b = bubbleRef.current;
        b.style.display = 'block';
        b.style.top = `${bubblePos.current.top}px`;
        b.style.left = `${bubblePos.current.left}px`;

        // Add a temporary glowing border to target
        targetEl.classList.add('tutorial-target-highlight');
      } else {
        if (highlightRef.current) highlightRef.current.style.display = 'none';
        if (bubbleRef.current) bubbleRef.current.style.display = 'none';
        firstFrame = true;
      }
      animationRef.current = requestAnimationFrame(update);
    };

    animationRef.current = requestAnimationFrame(update);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      const targetEl = document.getElementById(activeStep.targetId);
      if (targetEl) {
        targetEl.classList.remove('tutorial-target-highlight');
      }
    };
  }, [activeStep, currentStep]);

  // Handle checking state automatically to see if user manually achieved the step
  useEffect(() => {
    const checkTimer = setInterval(() => {
      if (mode === 'advanced') {
        switch (currentStep) {
          case 0: if (state.modInfo.displayName && state.modInfo.displayName !== 'Untitled Mod') setCurrentStep(1); break;
          case 1: if (document.getElementById('tutorial-type-MixerInteraction')) setCurrentStep(2); break;
          case 2: if (state.elements.some(el => el.type === 'MixerInteraction')) setCurrentStep(3); break;
          case 3: 
            const activeMixer = state.elements.find(el => el.type === 'MixerInteraction');
            if (activeMixer?.data.display_name && activeMixer.data.display_name !== 'Untitled') setCurrentStep(4);
            break;
          case 4: if (document.getElementById('tutorial-type-Commodity')) setCurrentStep(5); break;
          case 5: if (state.elements.some(el => el.type === 'Commodity')) setCurrentStep(6); break;
          case 6: 
             const activeComm = state.elements.find(el => el.type === 'Commodity');
             if (activeComm?.data.decay_rate === 0.5 || activeComm?.data.decay_rate === '0.5') setCurrentStep(7);
             break;
          case 7: if (document.getElementById('tutorial-type-LootActionSet')) setCurrentStep(8); break;
          case 8: if (state.elements.some(el => el.type === 'LootActionSet')) setCurrentStep(9); break;
          case 9:
             const activeLoot = state.elements.find(el => el.type === 'LootActionSet');
             if (activeLoot?.data.internal_name === 'DramaQueen_Loot') setCurrentStep(10);
             break;
          case 10: if (document.getElementById('tutorial-type-Broadcaster')) setCurrentStep(11); break;
          case 11: if (state.elements.some(el => el.type === 'Broadcaster')) setCurrentStep(12); break;
          case 12:
             const activeBroad = state.elements.find(el => el.type === 'Broadcaster');
             if (activeBroad?.data.radius === 10 || activeBroad?.data.radius === '10') setCurrentStep(13);
             break;
        }
        return;
      }

      switch (currentStep) {
        case 0:
          if (state.modInfo.displayName && 
              state.modInfo.displayName.trim().length >= 3 && 
              state.modInfo.displayName !== 'Untitled Mod') {
            setCurrentStep(1);
          }
          break;
        case 1:
          // Check if TypePicker is active inside viewport
          if (document.getElementById('tutorial-type-Trait')) {
            setCurrentStep(2);
          }
          break;
        case 2:
          // Has Trait element
          if (state.elements.some(el => el.type === 'Trait')) {
            setCurrentStep(3);
          }
          break;
        case 3:
          const activeTrait = state.elements.find(el => el.type === 'Trait');
          if (activeTrait?.data.display_name && activeTrait.data.display_name.trim().length >= 3) {
            // Automatically prompt next
            setCurrentStep(4);
          }
          break;
        case 4:
          if (document.getElementById('tutorial-type-Buff')) {
            setCurrentStep(5);
          }
          break;
        case 5:
          if (state.elements.some(el => el.type === 'Buff')) {
            setCurrentStep(6);
          }
          break;
        case 6:
          const activeBuffName = state.elements.find(el => el.type === 'Buff');
          if (activeBuffName?.data.buff_name && activeBuffName.data.buff_name.trim().length >= 3) {
            setCurrentStep(7);
          }
          break;
        case 7:
          const activeBuffMood = state.elements.find(el => el.type === 'Buff');
          if (activeBuffMood?.data.mood_type === 'Tense') {
            setCurrentStep(8);
          }
          break;
        case 8:
          const activeBuffWeight = state.elements.find(el => el.type === 'Buff');
          if (activeBuffWeight?.data.mood_weight === 2 || activeBuffWeight?.data.mood_weight === '2') {
            setCurrentStep(9);
          }
          break;
        case 9:
          if (document.getElementById('tutorial-type-XmlInjectorSnippet')) {
            setCurrentStep(10);
          }
          break;
        case 10:
          if (state.elements.some(el => el.type === 'XmlInjectorSnippet')) {
            setCurrentStep(11);
          }
          break;
        case 11:
          const activeInj = state.elements.find(el => el.type === 'XmlInjectorSnippet');
          if (activeInj?.data.injection_type) {
            setCurrentStep(12);
          }
          break;
      }
    }, 1000);

    return () => clearInterval(checkTimer);
  }, [currentStep, state, mode]);

  return (
    <>
      <style>{`
        .tutorial-target-highlight {
          box-shadow: 0 0 0 8px rgba(245, 158, 11, 0.4), 0 0 0 16px rgba(245, 158, 11, 0.2), 0 0 60px rgba(245, 158, 11, 0.6) !important;
          border-color: #f59e0b !important;
          background-color: rgba(245, 158, 11, 0.05) !important;
          animation: pulseHighlight 1.5s infinite !important;
          position: relative;
          z-index: 140 !important;
          outline: 4px solid #f59e0b !important;
          outline-offset: 4px !important;
        }
        @keyframes pulseHighlight {
          0% { box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.4), 0 0 0 8px rgba(245, 158, 11, 0.1); transform: scale(1); }
          50% { box-shadow: 0 0 0 15px rgba(245, 158, 11, 0.7), 0 0 0 30px rgba(245, 158, 11, 0.3); transform: scale(1.02); }
          100% { box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.4), 0 0 0 8px rgba(245, 158, 11, 0.1); transform: scale(1); }
        }
      `}</style>

      {/* Target Focus Ring Background Mask if element is active (gentle pointer, but don't hijack clicks) */}
      <div 
        ref={highlightRef}
        className="fixed border-[8px] border-dashed border-amber-500 rounded-[2.5rem] pointer-events-none z-[140] opacity-80 animate-[bounce_2s_infinite]"
        style={{ display: 'none' }}
      />

      {/* Interactive Speech bubble */}
      <div 
        ref={bubbleRef}
        style={{ display: 'none', width: '550px', zIndex: 500 }} 
        className="fixed bg-white border-[8px] border-amber-400 rounded-[3.5rem] shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-300 font-sans border-t-[12px] select-none"
      >
        {/* Step Marker Badge */}
        <div className="flex items-center justify-between">
          <span className="px-4 py-2 bg-amber-50 text-amber-700 text-xs font-black tracking-widest rounded-full uppercase border-2 border-amber-200 flex items-center gap-2">
            <img src="/bee.png" className="w-5 h-5 object-contain" alt="" />
            Step {currentStep + 1} of {steps.length}
          </span>
          <button 
            onClick={onClose}
            className="text-sm font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider"
          >
            End Tour ✕
          </button>
        </div>

        {/* Dynamic Coach Bubble Area */}
        <div className="space-y-4">
          <h4 className="text-3xl font-black text-slate-800 leading-tight uppercase font-sans">
            {activeStep.title}
          </h4>
          <p className="text-lg font-bold text-slate-600 leading-relaxed font-sans">
            {activeStep.text}
          </p>

          {/* Neurodivergent Chunk/Help panel */}
          <div className="p-5 bg-slate-50 border-2 border-slate-150 rounded-3xl text-sm font-medium text-slate-500 leading-relaxed font-sans space-y-2">
            <span className="font-extrabold text-xs uppercase tracking-wider opacity-60 block">Why we do this:</span>
            <p className="italic text-base">{activeStep.explain}</p>
          </div>

          <div className="p-5 bg-amber-50/50 border-2 border-amber-100 rounded-3xl text-sm font-bold text-amber-800 leading-relaxed font-sans">
            {activeStep.neurotip}
          </div>
        </div>

        {/* Task Expectation status */}
        <div className="pt-4 border-t-2 border-slate-100 flex items-center justify-between gap-1">
          <div className="flex items-center gap-3">
            <span className="inline-block w-3 h-3 rounded-full bg-amber-500 animate-ping" />
            <span className="text-xs font-black uppercase text-slate-400 font-sans tracking-wide">
              Waiting for: <span className="text-slate-600">{activeStep.expectedStateMsg}</span>
            </span>
          </div>
        </div>

        {/* Controls Block */}
        <div className="flex items-center gap-3 pt-4">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black uppercase tracking-wider text-xs rounded-2xl transition-all"
            >
              Back
            </button>
          )}

          <button
            onClick={handleAutoComplete}
            className="flex-1 py-4 px-6 bg-amber-450 hover:bg-amber-500 text-white font-black uppercase tracking-wider text-xs rounded-2xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
            title="Automatically input/select items to learn via seeing it happen"
          >
            <span>👉 Auto-Complete Step</span>
          </button>
        </div>
      </div>
    </>
  );
}
