import { DBPFResource, ModEntityType, ModElement } from '../types';
import { parseStbl } from './dbpf';

/**
 * Maps DBPF resources back to the application state.
 */
export function importFromPackage(resources: DBPFResource[]): any {
  const textDecoder = new TextDecoder();
  const parser = new DOMParser();

  const elements: ModElement[] = [];
  const strings = new Map<number, string>();
  
  // 1. Resolve all strings first
  resources.forEach(res => {
    if (res.typeId === 0x220557DA) {
      const parsedStrings = parseStbl(res.data);
      const localeId = Number(res.instanceId >> 56n) & 0xFF;
      const isEnglish = localeId === 0x00 || localeId === 0x17 || localeId === 0x07;
      
      parsedStrings.forEach(s => {
        const key = s.keyHash >>> 0;
        if (!strings.has(key) || isEnglish) {
          strings.set(key, s.value);
        }
      });
    }
  });

  const stringResolver = (val: string) => resolveString(val, strings);

  // 2. Pre-parse all XML to build an instance map for reference resolution
  const tuningResources: { res: DBPFResource, root: Element, xml: string }[] = [];
  const instanceMap = new Map<string, { id: string, type: ModEntityType, name: string }>();

  resources.forEach(res => {
    const xmlTypes = [0x034533A0, 0x6017E896, 0x0C772E27, 0xE882D22F, 0xCB5FDDC7, 0x339BC5BD, 0x7E912205];
    const isXml = xmlTypes.includes(res.typeId) || res.data[0] === 0x3C;
    if (!isXml || res.typeId === 0x220557DA) return;

    try {
      const xml = textDecoder.decode(res.data);
      const doc = parser.parseFromString(xml, 'application/xml');
      const root = doc.documentElement;
      if (!root || root.nodeName === 'parsererror') return;

      const className = (root.getAttribute('c') || '').trim();
      const instanceId = root.getAttribute('s') || '';
      const name = root.getAttribute('n') || '';

      if (!instanceId) return;

      const typeMap: Record<string, ModEntityType> = {
        'Trait': 'Trait',
        'Buff': 'Buff',
        'SocialMixerInteraction': 'MixerInteraction',
        'SocialInteraction': 'SocialInteraction',
        'SuperInteraction': 'SuperInteraction',
        'LootActions': 'LootActionSet',
        'Commodity': 'Commodity',
        'Statistic': 'Statistic',
        'Snippet': 'XmlInjectorSnippet'
      };

      const type = typeMap[className] || (className as any) || 'GenericElement';
      
      // Store in instance map for resolution
      const hexId = BigInt(instanceId).toString(16).toLowerCase();
      instanceMap.set(instanceId, { id: `${type}_${hexId}`, type, name });
      
      tuningResources.push({ res, root, xml });
    } catch (e) {
      console.error('Pre-parse fail:', e);
    }
  });

  // 3. Resolve references using the instance map
  const resolveRef = (decimalId: string | null, fallbackType: ModEntityType) => {
    if (!decimalId || decimalId === '0' || decimalId === 'None') return undefined;
    const info = instanceMap.get(decimalId);
    if (info) return info.id;
    
    // External reference (base game)
    const hexId = BigInt(decimalId).toString(16).toLowerCase();
    return `${fallbackType}_${hexId}`;
  };

  // 4. Final parse and element creation
  tuningResources.forEach(({ root, res }) => {
    try {
      const className = root.getAttribute('c') || '';
      const instanceId = root.getAttribute('s') || '';
      const nAttribute = root.getAttribute('n') || '';
      const info = instanceMap.get(instanceId);
      if (!info) return;

      const elementData: any = { internal_name: nAttribute };
      
      // Map basic fields
      const mapField = (selector: string, key: string, isString = false, isRef = false, refType: ModEntityType = 'GenericElement') => {
        const node = root.querySelector(selector);
        if (node) {
          const val = node.textContent;
          if (val) {
            if (isString) elementData[key] = stringResolver(val);
            else if (isRef) elementData[key] = resolveRef(val, refType);
            else elementData[key] = val;
          }
        }
      };

      mapField('T[n="display_name"]', 'display_name', true);
      mapField('T[n="trait_description"]', 'trait_description', true);
      mapField('T[n="buff_description"]', 'buff_description', true);
      mapField('T[n="buff_name"]', 'buff_name', true);
      mapField('T[n="mood_type"]', 'mood_type');
      mapField('T[n="mood_weight"]', 'mood_weight');
      mapField('T[n="max_duration"]', 'duration');

      // Special handling for LootActionSet
      if (info.type === 'LootActionSet') {
        const loots = root.querySelector('L[n="loot_actions"]');
        if (loots) {
          const buff = loots.querySelector('V[t="buff_loot_op"], V[t="buff"]');
          if (buff) {
            const outerU = buff.querySelector('U[n="buff"]');          // outer U
            const innerU = outerU?.querySelector('U[n="buff"]');       // inner U with buff_type
            elementData.variant = 'buff';
            elementData.buff_ref = resolveRef(innerU?.querySelector('T[n="buff_type"]')?.textContent || '', 'Buff');
            elementData.buff_subject = outerU?.querySelector('E[n="subject"]')?.textContent || 'Actor';
            elementData.buff_reason_ref = innerU?.querySelector('V[n="buff_reason"] T')?.textContent;
            // Preserve raw tests XML so it can be round-tripped
            elementData.buff_tests_xml = outerU?.querySelector('L[n="tests"]')?.outerHTML || '';
          }
          const knowOtherTrait = loots.querySelector('V[t="know_other_sims_trait"]');
          if (knowOtherTrait) {
            elementData.variant = 'know_other_sims_trait';
            const traits = knowOtherTrait.querySelectorAll('L[n="potential_traits"] T');
            elementData.trait_refs = Array.from(traits).map(t => resolveRef(t.textContent || '', 'Trait'));
            elementData.has_notification = !!knowOtherTrait.querySelector('V[n="notification"][t="enabled"]');
          }
          const buffRemoval = loots.querySelector('V[t="buff_removal"]');
          if (buffRemoval) {
            elementData.variant = 'buff_removal';
            elementData.buff_ref = resolveRef(buffRemoval.querySelector('T')?.textContent || '', 'Buff');
          }
          const trait = loots.querySelector('V[t="trait_loot_op"], V[t="trait_add"]');
          if (trait) {
            elementData.variant = 'know_trait';
            elementData.trait_ref = resolveRef(trait.querySelector('T[n="trait"]')?.textContent || '', 'Trait');
          }
          const traitRemove = loots.querySelector('V[t="trait_remove"]');
          if (traitRemove) {
            elementData.variant = 'remove_trait';
            elementData.trait_ref = resolveRef(traitRemove.querySelector('T')?.textContent || '', 'Trait');
          }
          const statMax = loots.querySelector('V[t="statistic_set_max"]');
          if (statMax) {
            elementData.variant = 'stat_set_max';
            elementData.stat_ref = resolveRef(statMax.querySelector('T[n="stat"]')?.textContent || '', 'Commodity');
          }
          const statChange = loots.querySelector('V[t="statistic_change"]');
          if (statChange) {
            elementData.variant = 'statistic_change';
            elementData.stat_ref = resolveRef(statChange.querySelector('T[n="stat"]')?.textContent || '', 'Commodity');
            elementData.amount = parseInt(statChange.querySelector('T[n="amount"]')?.textContent || '0');
          }
          const money = loots.querySelector('V[t="money_loot"]');
          if (money) {
            elementData.variant = 'money';
            elementData.amount = parseInt(money.querySelector('T[n="value"]')?.textContent || '0');
          }
          const relBit = loots.querySelector('V[t="relationship_bit_add"]');
          if (relBit) {
            elementData.variant = 'relationship_bit';
            elementData.rel_bit_ref = resolveRef(relBit.querySelector('T[n="bit_target"]')?.textContent || '', 'RelBit');
          }
          const notification = root.querySelector('V[n="notification"] U[n="notification"]');
          if (notification) {
            elementData.variant = 'notification';
            elementData.notification_title = stringResolver(notification.querySelector('V[n="title"] T')?.textContent || '');
            elementData.notification_text = stringResolver(notification.querySelector('V[n="text"] T')?.textContent || '');
          }
        }
      }

      elements.push({
        id: info.id,
        type: info.type,
        data: elementData
      });
    } catch (err) {
      console.error('Final parse fail:', err);
    }
  });

  return {
    elements,
    stringCount: strings.size,
    strings
  };
}

function resolveString(val: string | null | undefined, strings: Map<number, string>): string {
  if (!val) return '';
  const trimmed = val.trim();
  let hashStr = trimmed.startsWith('0x') ? trimmed.substring(2) : trimmed;
  
  if (/^[0-9A-Fa-f]+$/.test(hashStr)) {
    const key = parseInt(hashStr, 16) >>> 0;
    if (strings.has(key)) return strings.get(key)!;
  }
  
  if (/^\d+$/.test(trimmed)) {
    const key = parseInt(trimmed, 10) >>> 0;
    if (strings.has(key)) return strings.get(key)!;
  }
  
  return trimmed;
}

