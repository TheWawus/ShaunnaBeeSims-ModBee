import { DBPFResource, ModEntityType } from '../types';
import { parseStbl } from './dbpf';

/**
 * Maps DBPF resources back to the application state.
 */
export function importFromPackage(resources: DBPFResource[]): any {
  const textDecoder = new TextDecoder();
  const parser = new DOMParser();

  const elements: any[] = [];
  // Find all STBLs to resolve strings
  const strings = new Map<number, string>();
  const stblResources = resources.filter(r => {
    if (r.typeId === 0x220557DA) return true;
    if (r.data && r.data.length > 4) {
      return r.data[0] === 0x53 && r.data[1] === 0x54 && r.data[2] === 0x42 && r.data[3] === 0x4C; // 'STBL'
    }
    return false;
  });
  
  console.log(`Import: Found ${stblResources.length} candidate STBL resources.`);

  stblResources.forEach(stblRes => {
    const parsedStrings = parseStbl(stblRes.data);
    
    // TS4 Locale is the first byte of the Instance ID
    const localeId = Number(stblRes.instanceId >> 56n) & 0xFF;
    
    // 0x17 is English US, 0x00 is English. 0x07 is sometimes used by tools like Mod Constructor for English. 
    const isEnglish = localeId === 0x00 || localeId === 0x17 || localeId === 0x07;
    
    console.log(`Import STBL: Instance=0x${stblRes.instanceId.toString(16)}, Locale=0x${localeId.toString(16)}, Strings=${parsedStrings.length}, English=${isEnglish}`);
    
    parsedStrings.forEach(s => {
      const key = s.keyHash >>> 0;
      // Prefer English but accept whatever we find if we have nothing better
      if (!strings.has(key) || isEnglish) {
        strings.set(key, s.value);
      }
    });
  });

  console.log(`Import: Total resolved unique strings: ${strings.size}`);

  // Mapping function 
  const stringResolver = (val: string) => resolveString(val, strings);

  // Parse XML resources
  let tuningAttempted = 0;
  let tuningParsed = 0;

  resources.forEach(res => {
    // Tuning type IDs for XML
    // 0x034533A0 is the universal tuning type. 
    // 0x6017E896, 0x0C772E27, etc. are specialized tuning types.
    const xmlTypes = [0x034533A0, 0x6017E896, 0x0C772E27, 0xE882D22F, 0xCB5FDDC7, 0x339BC5BD];
    const isXmlType = xmlTypes.includes(res.typeId);
    
    // Fallback detection - strictly < or BOM (some mods use weird Type IDs for their own tuning)
    const firstByte = res.data[0];
    const isLikelyXML = isXmlType || firstByte === 0x3C || firstByte === 0xEF;

    if (isLikelyXML && res.typeId !== 0x220557DA) {
      tuningAttempted++;
      try {
        const xml = textDecoder.decode(res.data);
        const trimmed = xml.trim();
        if (!trimmed.startsWith('<')) return;
        
        const doc = parser.parseFromString(xml, 'application/xml');
        const root = doc.documentElement;
        
        if (!root || root.nodeName === 'parsererror') {
          return;
        }

        const className = (root.getAttribute('c') || root.getAttribute('class') || '').trim();
        const instanceFullId = root.getAttribute('s') || root.getAttribute('id');
        const nAttribute = root.getAttribute('n') || root.getAttribute('name') || '';

        // If it lacks basic TS4 Tuning attributes AND isn't a direct "T" (Snippet/Text), skip it
        if (!className && !nAttribute && !instanceFullId && root.nodeName !== 'I' && root.nodeName !== 'T' && root.nodeName !== 'Instance') return;

        tuningParsed++;

        const typeMap: Record<string, ModEntityType> = {
          'Trait': 'Trait',
          'Buff': 'Buff',
          'SocialMixerInteraction': 'MixerInteraction',
          'SocialInteraction': 'SocialInteraction',
          'SuperInteraction': 'SuperInteraction',
          'LootActions': 'LootActionSet',
          'Commodity': 'Commodity',
          'StaticCommodity': 'Statistic',
          'Statistic': 'Statistic',
          'SimFilter': 'SimFilter',
          'PieMenuCategory': 'PieMenuCategory',
          'RoleState': 'RoleState',
          'Objective': 'Objective',
          'ObjectiveSet': 'ObjectiveSet',
          'HolidayTradition': 'HolidayTradition',
          'Aspiration': 'AspirationTrack',
          'AspirationTrack': 'AspirationTrack',
          'AspirationCategory': 'AspirationCategory',
          'Career': 'Career',
          'CareerLevel': 'Career',
          'RelationshipBit': 'RelBit',
          'RelBit': 'RelBit',
          'BalloonSet': 'BalloonSet',
          'Broadcaster': 'Broadcaster',
          'LotTrait': 'LotTrait',
          'Milestone': 'Milestone',
          'RewardSet': 'RewardSet',
          'SituationJob': 'SituationJob',
          'Situation': 'Situation',
          'SituationGoal': 'SituationGoal',
          'SituationGoalSet': 'SituationGoalSet',
          'Snippet': 'CustomTuningElement',
          'Recipe': 'CustomTuningElement'
        };

        const resolveRefId = (decimalId: string | null, type: string) => {
          if (!decimalId || decimalId === 'None') return undefined;
          try {
            // Check if it's already a hex string
            if (decimalId.startsWith('0x')) return `${type}_${decimalId.substring(2).toLowerCase()}`;
            // Otherwise treat as decimal
            const bigIntId = BigInt(decimalId);
            return `${type}_${bigIntId.toString(16).toLowerCase()}`;
          } catch (e) {
            return decimalId;
          }
        };

        const rawType = className || root.nodeName;
        const type: ModEntityType = typeMap[rawType] || (rawType as any) || (root.nodeName === 'T' ? 'CustomTuningElement' : 'GenericElement');
        
        const elementData: any = {
           internal_name: nAttribute
        };
      
      // Basic heuristic for common fields
      const fieldMappings: Record<string, string> = {
        'display_name': 'T[n="display_name"], T[n="display_name_gender_neutral"]',
        'trait_description': 'T[n="trait_description"]',
        'trait_origin_description': 'T[n="trait_origin_description"]',
        'buff_description': 'T[n="buff_description"]',
        'buff_name': 'T[n="buff_name"]',
        'buff_reason': 'T[n="buff_reason"]',
        'career_name': 'T[n="career_name"]',
        'career_description': 'T[n="career_description"]',
        'icon': 'T[n="icon"]',
        'mood_type': 'T[n="mood_type"]',
        'mood_weight': 'T[n="mood_weight"]',
        'duration': 'V[n="_temporary_commodity_info"] T[n="max_duration"]',
        'visible': 'T[n="visible"]',
        'trait_type': 'E[n="trait_type"]',
        'disable_aging': 'V[n="disable_aging"]',
        'removal_loot': 'T[n="removal_loot"]',
        'test_set_reference': 'T[n="test_set_reference"]',
        'permanent_buff': 'T[n="permanent_buff"]'
      };

      for (const [key, selector] of Object.entries(fieldMappings)) {
        const queryResult = root.querySelector(selector);
        if (queryResult) {
          const value = queryResult.textContent;
          if (value !== undefined && value !== null) {
            const keyLower = key.toLowerCase();
            const needsResolution = [
              'name', 'display_name', 'trait_description', 'buff_description', 
              'buff_name', 'buff_reason', 'career_name', 'career_description', 
              'trait_origin_description', 'buff_reason_string', 'description'
            ].some(k => keyLower.includes(k));
            
            const needsRefResolution = ['removal_loot', 'test_set_reference', 'permanent_buff'].includes(key);
            
            if (needsResolution) {
               elementData[key] = stringResolver(value);
            } else if (needsRefResolution) {
               let refType = 'GenericElement';
               if (key.toLowerCase().includes('buff')) refType = 'Buff';
               else if (key.toLowerCase().includes('trait')) refType = 'Trait';
               else if (key.toLowerCase().includes('loot')) refType = 'LootActionSet';
               else if (key.toLowerCase().includes('test')) refType = 'SimFilter';
               elementData[key] = resolveRefId(value, refType);
            } else if (key === 'visible') {
               elementData[key] = value !== 'False';
            } else if (key === 'mood_weight' || key === 'duration') {
               elementData[key] = parseInt(value, 10);
            } else if (key === 'disable_aging') {
               elementData[key] = true;
            } else {
               elementData[key] = value;
            }
          }
        }
      }

      // Handle ages
      const agesList = root.querySelector('L[n="ages"]');
      if (agesList) {
          elementData.ages = Array.from(agesList.querySelectorAll('E')).map(e => e.textContent);
      }

      // Special case for names/display
      if (className === 'Commodity' && nAttribute.includes('Interval')) {
          elementData.display_name = 'Interval Controller';
      }
      
      // If display_name is missing but we have internal_name, use a cleaner version as fallback
      if (!elementData.display_name && nAttribute) {
          // Zerbu MC5 uses namespaces like Creator_Mod:Element
          const parts = nAttribute.split(':');
          const lastPart = parts[parts.length - 1];
          // Use the last part but try to make it readable if it's CamelCase or has underscores
          elementData.display_name = lastPart.replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .replace(/^ /, '')
            .trim();
      }

      // Special case for LootActionSet - try to find what it does
      if (className === 'LootActions' || type === 'LootActionSet') {
        const lootsList = root.querySelector('L[n="loot_actions"]');
        if (lootsList) {
          // Buff loot
          const buffLoot = lootsList.querySelector('V[t="buff"] T[n="buff_type"]');
          if (buffLoot) {
            elementData.variant = 'buff';
            elementData.buff_ref = resolveRefId(buffLoot.textContent, 'Buff');
          }
          // Stat loot
          const statLoot = lootsList.querySelector('V[t="statistics"] T[n="stat"]');
          if (statLoot) {
            elementData.variant = 'stat_set_max';
            elementData.stat_ref = resolveRefId(statLoot.textContent, 'Commodity');
          }
          // Trait loot
          const traitLoot = lootsList.querySelector('V[t="trait_add"] T[n="trait"]');
          if (traitLoot) {
             elementData.variant = 'know_trait';
             elementData.trait_ref = resolveRefId(traitLoot.textContent, 'Trait');
          }
        }
      }

      if (className === 'SocialMixerInteraction') {
          // SocialMixerInteraction often uses a random ID in n. 
          // We don't have a specific field for display name in the schema mapping yet for it
          // but we can at least ensure we don't show the random ID alone if it looks like one.
          if (!elementData.display_name && nAttribute.length > 20) {
              elementData.display_name = `Custom Interaction ${instanceFullId}`;
          }
      }

      elements.push({
        id: `${type}_${instanceFullId || Math.random().toString(36).substr(2, 9)}`,
        type: type,
        data: elementData
      });
    } catch (err) {
      console.error('Failed to process tuning resource:', err);
    }
  }
});

  // Try to find a good mod name
  let importedModName = 'Imported Mod';
  // Prefer checking for a Trait to get the mod name
  const traits = elements.filter(e => e.type === 'Trait');
  if (traits.length > 0) {
    // Use the first trait's name, try to strip suffixes if it's internal
    const trait = traits[0];
    if (trait.data.display_name && trait.data.display_name !== trait.data.internal_name) {
        importedModName = trait.data.display_name;
    } else if (trait.data.internal_name) {
        importedModName = trait.data.internal_name.split(':').pop() || trait.data.internal_name.split('_').pop() || trait.data.internal_name;
    }
  }

  return {
    elements,
    importedModName,
    stringCount: strings.size,
    strings
  };
}

function resolveString(val: string | null | undefined, strings: Map<number, string>): string {
  if (!val) return '';
  const trimmed = val.trim();
  
  // 1. Try to parse as hex
  let hashStr = trimmed;
  if (hashStr.startsWith('0x')) {
    hashStr = hashStr.substring(2);
  }
  
  if (/^[0-9A-Fa-f]+$/.test(hashStr)) {
    const key = parseInt(hashStr, 16) >>> 0;
    if (strings.has(key)) return strings.get(key)!;
  }
  
  // 2. Try to parse as decimal
  if (/^\d+$/.test(trimmed)) {
    const key = parseInt(trimmed, 10) >>> 0;
    if (strings.has(key)) return strings.get(key)!;
  }
  
  return trimmed;
}
