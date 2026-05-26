import { ModElement, DBPFResource } from '../types';
import { fnv32, fnv64, createStbl } from './dbpf';
import { TEMPLATES, patchSimData } from './generators/simData';

/**
 * Converts a mod property hash to XML format.
 */
function toStblRef(id: number | bigint): string {
  return `0x${id.toString(16).toUpperCase()}`;
}

/**
 * Generates a consistent instance ID for an element.
 * Tries to extract numeric ID from imported elements or hashes the internal name.
 */
export function getInstanceId(el: any, allElements?: ModElement[]): bigint {
  const id = typeof el === 'string' ? el : (el.id || '');
  
  // If we have access to all elements, try to find the full element object first
  if (allElements) {
    const found = allElements.find(e => e.id === id);
    if (found) {
      // Use internal_name if available for hashing, otherwise try numeric suffix
      const n = found.data?.internal_name;
      if (n) return fnv64(n);
      
      const match = found.id.match(/_(\d+)$/);
      if (match) {
        try {
          return BigInt(match[1]);
        } catch (e) { /* ignore */ }
      }
      return fnv64(found.id);
    }
  }

  // Fallback for raw IDs or strings
  const match = id.match(/_(\d+)$/);
  if (match) {
    try {
      return BigInt(match[1]);
    } catch (e) { /* ignore */ }
  }
  
  return fnv64(id);
}

/**
 * Gets the tuning 'n' attribute.
 */
function getTuningName(el: ModElement): string {
  return el.data.internal_name || el.id;
}

const MOOD_IDS: Record<string, string> = {
  'Happy': '14640',
  'Angry': '14631',
  'Confident': '14634',
  'Tense': '14645',
  'Flirty': '14638',
  'Energized': '14636',
  'Uncomfortable': '14646',
  'Bored': '14633',
  'Dazed': '14635',
  'Embarrassed': '14637',
  'Focused': '14639',
  'Inspired': '14641',
  'Playful': '14642',
  'Sad': '14643',
  'Scared': '251719'
};

/**
 * Serializes a Trait element to XML and SimData.
 */
function serializeTrait(el: ModElement, strings: Record<number, string>, allElements: ModElement[]): { xml: string, simData?: Uint8Array } {
  const data = el.data;
  const instanceId = getInstanceId(el, allElements);
  const n = getTuningName(el);
  
  const nameHash = fnv32(data.display_name || '');
  strings[nameHash] = data.display_name || '';
  
  const descHash = fnv32(data.trait_description || '');
  strings[descHash] = data.trait_description || '';

  const originHash = fnv32(data.trait_origin_description || '');
  if (data.trait_origin_description) strings[originHash] = data.trait_origin_description;

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<I c="Trait" i="trait" m="traits.traits" n="${n}" s="${instanceId}">
  <T n="display_name">${toStblRef(nameHash)}</T>
  <T n="trait_description">${toStblRef(descHash)}</T>
  ${data.trait_origin_description ? `<T n="trait_origin_description">${toStblRef(originHash)}</T>` : ''}
  <E n="trait_type">${data.trait_type || 'PERSONALITY'}</E>
  <L n="ages">
    ${(data.ages || ['YOUNGADULT', 'ADULT', 'ELDER']).map((age: string) => `<E>${age}</E>`).join('\n    ')}
  </L>
  <V n="ui_category" t="ui_trait_category_tag">
    <E n="ui_trait_category_tag">${data.cas_category || 'PRIMARY'}</E>
  </V>
  ${data.icon ? `<T n="icon">${data.icon}</T>` : ''}
  ${data.disable_aging ? '<T n="disable_aging">True</T>' : ''}
  ${data.voice_effect ? `<T n="voice_effect">${data.voice_effect}</T>` : ''}
  ${data.permanent_buff ? `<T n="permanent_buff">${getInstanceId(data.permanent_buff, allElements)}</T>` : ''}
  ${data.walkstyle ? `<T n="walkstyle">${data.walkstyle}</T>` : ''}
  <L n="conflicting_traits">
    ${(data.conflicting_traits || []).map((t: string) => `<T>${getInstanceId(t, allElements)}</T>`).join('\n    ')}
  </L>
  ${data.whims ? `<T n="whims">${getInstanceId(data.whims, allElements)}</T>` : ''}
</I>`.trim();

  const simData = patchSimData({
    templateB64: TEMPLATES.TRAIT.b64,
    tuningId: instanceId,
    nameHash: fnv32(n),
    tuningIdOffset: TEMPLATES.TRAIT.tuningIdOffset,
    nameHashOffset: TEMPLATES.TRAIT.nameHashOffset
  });

  return { xml, simData };
}

/**
 * Serializes a Buff element to XML and SimData.
 */
function serializeBuff(el: ModElement, strings: Record<number, string>, allElements: ModElement[]): { xml: string, simData?: Uint8Array } {
  const data = el.data;
  const instanceId = getInstanceId(el, allElements);
  const n = getTuningName(el);

  const nameHash = fnv32(data.buff_name || '');
  strings[nameHash] = data.buff_name || '';
  
  const descHash = fnv32(data.buff_description || '');
  strings[descHash] = data.buff_description || '';

  const reasonHash = fnv32(data.buff_reason || '');
  if (data.buff_reason) strings[reasonHash] = data.buff_reason;

  const moodId = MOOD_IDS[data.mood_type] || data.mood_type || '14640';

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<I c="Buff" i="buff" m="buffs.buff" n="${n}" s="${instanceId}">
  <T n="buff_name">${toStblRef(nameHash)}</T>
  <T n="buff_description">${toStblRef(descHash)}</T>
  ${data.buff_reason ? `<T n="buff_reason">${toStblRef(reasonHash)}</T>` : ''}
  <T n="mood_type">${moodId}</T>
  <T n="mood_weight">${data.mood_weight || 1}</T>
  ${data.duration ? `
  <V n="_temporary_commodity_info" t="enabled">
    <U n="enabled">
      <T n="max_duration">${data.duration}</T>
    </U>
  </V>` : ''}
  <T n="visible">${data.visible !== false ? 'True' : 'False'}</T>
  <T n="icon">${data.icon || '2f7d0004:00000000:0000000000000000'}</T>
  ${data.decay_modifiers ? `
  <L n="mood_decay_modifiers">
    ${data.decay_modifiers}
  </L>` : ''}
  ${data.whims ? `<T n="whims">${getInstanceId(data.whims, allElements)}</T>` : ''}
</I>`.trim();

  const simData = patchSimData({
    templateB64: TEMPLATES.BUFF.b64,
    tuningId: instanceId,
    nameHash: fnv32(n),
    tuningIdOffset: TEMPLATES.BUFF.tuningIdOffset,
    nameHashOffset: TEMPLATES.BUFF.nameHashOffset
  });

  return { xml, simData };
}

/**
 * Serializes a Commodity/Statistic element to XML.
 */
function serializeCommodity(el: ModElement, allElements: ModElement[]): string {
  const data = el.data;
  const instanceId = getInstanceId(el, allElements);
  const n = getTuningName(el);

  const atZeroLootId = data.at_zero_loot ? getInstanceId(data.at_zero_loot, allElements) : null;

  return `<?xml version="1.0" encoding="utf-8"?>
<I c="Commodity" i="statistic" m="statistics.commodity" n="${n}" s="${instanceId}">
  <T n="_default_convergence_value">0</T>
  <T n="decay_rate">${data.decay_rate || 1}</T>
  <U n="initial_tuning">
    <T n="_value">${data.initial_value || 10}</T>
  </U>
  <T n="min_value_tuning">${data.min_value || 0}</T>
  <T n="max_value_tuning">${data.max_value || 10}</T>
  <L n="states">
    ${atZeroLootId ? `
    <U>
      <L n="loot_list">
        <T>${atZeroLootId}</T>
      </L>
      <T n="value">0</T>
    </U>` : ''}
  </L>
</I>`.trim();
}

/**
 * Serializes a LootActionSet element to XML.
 */
function serializeLoot(el: ModElement, strings: Record<number, string>, allElements: ModElement[]): string {
  const data = el.data;
  const instanceId = getInstanceId(el, allElements);
  const n = getTuningName(el);

  let lootActionXml = '';
  switch (data.variant) {
    case 'buff':
      if (data.buff_ref) {
        lootActionXml = `
    <V t="buff">
      <U n="buff">
        <U n="buff">
          <T n="buff_type">${getInstanceId(data.buff_ref, allElements)}</T>
          ${data.buff_reason_ref ? `<V n="buff_reason" t="enabled"><T n="enabled">${data.buff_reason_ref}</T></V>` : ''}
        </U>
        <E n="subject">${data.buff_subject || 'Actor'}</E>
        ${data.buff_tests_xml || ''}
      </U>
    </V>`;
      }
      break;
    case 'know_other_sims_trait':
      if (data.trait_refs && data.trait_refs.length > 0) {
        lootActionXml = `
    <V t="know_other_sims_trait">
      <U n="know_other_sims_trait">
        ${data.has_notification ? `
        <V n="notification" t="enabled">
          <V n="enabled" t="reference">
            <T n="reference">12345</T> <!-- Generic notification -->
          </V>
        </V>` : ''}
        <V n="traits" t="specified">
          <U n="specified">
            <L n="potential_traits">
              ${data.trait_refs.map((tr: string) => `<T>${getInstanceId(tr, allElements)}</T>`).join('\n              ')}
            </L>
          </U>
        </V>
      </U>
    </V>`;
      }
      break;
    case 'buff_removal':
       if (data.buff_ref) {
        lootActionXml = `
    <V t="buff_removal">
      <U n="buff_removal">
        <L n="buffs_to_remove">
          <T>${getInstanceId(data.buff_ref, allElements)}</T>
        </L>
      </U>
    </V>`;
      }
      break;
    case 'stat_set_max':
      if (data.stat_ref) {
        lootActionXml = `
    <V t="statistics">
      <V n="statistics" t="statistic_set_max">
        <U n="statistic_set_max">
          <T n="stat">${getInstanceId(data.stat_ref, allElements)}</T>
        </U>
      </V>
    </V>`;
      }
      break;
    case 'know_trait':
      if (data.trait_ref) {
        lootActionXml = `
    <V t="trait_add">
      <U n="trait_add">
        <T n="trait">${getInstanceId(data.trait_ref, allElements)}</T>
      </U>
    </V>`;
      }
      break;
    case 'remove_trait':
      if (data.trait_ref) {
        lootActionXml = `
    <V t="trait_remove">
      <U n="trait_remove">
        <T n="trait">${getInstanceId(data.trait_ref, allElements)}</T>
      </U>
    </V>`;
      }
      break;
    case 'money':
      lootActionXml = `
    <V t="money_loot">
      <U n="money_loot">
        <V n="amount" t="literal">
          <U n="literal">
            <T n="value">${data.amount || 0}</T>
          </U>
        </V>
      </U>
    </V>`;
      break;
    case 'statistic_change':
      if (data.stat_ref) {
        lootActionXml = `
    <V t="statistics">
      <V n="statistics" t="statistic_change">
        <U n="statistic_change">
          <T n="amount">${data.amount || 0}</T>
          <T n="stat">${getInstanceId(data.stat_ref, allElements)}</T>
        </U>
      </V>
    </V>`;
      }
      break;
    case 'skill_level_change':
      if (data.stat_ref) {
        lootActionXml = `
    <V t="statistics">
      <V n="statistics" t="skill_level_change">
        <U n="skill_level_change">
          <T n="level_change">${data.amount || 0}</T>
          <T n="stat">${getInstanceId(data.stat_ref, allElements)}</T>
        </U>
      </V>
    </V>`;
      }
      break;
    case 'relationship_bit':
      if (data.rel_bit_ref) { 
        lootActionXml = `
    <V t="relationship_bit_add">
      <U n="relationship_bit_add">
        <T n="bit_target">${getInstanceId(data.rel_bit_ref, allElements)}</T>
      </U>
    </V>`;
      }
      break;
    case 'notification':
      const titleHash = fnv32(data.notification_title || '');
      const textHash = fnv32(data.notification_text || '');
      if (data.notification_title) strings[titleHash] = data.notification_title;
      if (data.notification_text) strings[textHash] = data.notification_text;
      
      lootActionXml = `
    <V t="notification_and_dialog">
      <U n="notification_and_dialog">
        <V n="dialog" t="notification">
          <U n="notification">
            ${data.notification_title ? `<V n="text" t="single"><T n="single">${toStblRef(textHash)}</T></V>` : ''}
            ${data.notification_title ? `<V n="title" t="enabled"><T n="enabled">${toStblRef(titleHash)}</T></V>` : ''}
          </U>
        </V>
      </U>
    </V>`;
      break;
  }

  return `<?xml version="1.0" encoding="utf-8"?>
<I c="LootActions" i="action" m="interactions.utils.loot" n="${n}" s="${instanceId}">
  <L n="loot_actions">
    ${lootActionXml}
  </L>
</I>`.trim();
}

/**
 * Serializes a MixerInteraction element to XML.
 */
function serializeMixer(el: ModElement, strings: Record<number, string>, allElements: ModElement[]): string {
  const data = el.data;
  const instanceId = getInstanceId(el, allElements);
  const n = getTuningName(el);

  const nameHash = fnv32(data.display_name || '');
  strings[nameHash] = data.display_name || '';

  const categoryTags = data.category_tags || ['Interaction_Mixer', 'Interaction_All', 
    'Interaction_SocialAll', 'Interaction_SocialMixer', 'Interaction_Friendly', 'Interaction_Chat'];
  const tagXml = categoryTags.map((t: string) => `<E>${t}</E>`).join('\n    ');

  return `<?xml version="1.0" encoding="utf-8"?>
<I c="SocialMixerInteraction" i="interaction" m="interactions.social.social_mixer_interaction" n="${n}" s="${instanceId}">
  <T n="display_name">${toStblRef(nameHash)}</T>
  <L n="interaction_category_tags">
    ${tagXml}
  </L>
  <V n="outcome" t="single">
    <U n="single">
      <U n="outcome">
        <L n="loot_list">
          ${data.loot_on_completion ? `<T>${getInstanceId(data.loot_on_completion, allElements)}</T>` : ''}
        </L>
      </U>
    </U>
  </V>
  <U n="sub_action">
    <T n="base_weight">2</T>
  </U>
  <E n="target_type">TARGET</E>
  <L n="test_globals">
    <V t="sim_info">
      <U n="sim_info">
        <V n="ages" t="specified">
          <L n="specified">
            <E>TEEN</E>
            <E>YOUNGADULT</E>
            <E>ADULT</E>
            <E>ELDER</E>
          </L>
        </V>
      </U>
    </V>
  </L>
</I>`.trim();
}

/**
 * Serializes a SocialInteraction element to XML.
 */
function serializeSocial(el: ModElement, strings: Record<number, string>, allElements: ModElement[]): string {
  const data = el.data;
  const instanceId = getInstanceId(el, allElements);
  const n = getTuningName(el);

  const nameHash = fnv32(data.display_name || '');
  strings[nameHash] = data.display_name || '';

  return `<?xml version="1.0" encoding="utf-8"?>
<I c="SocialSuperInteraction" i="interaction" m="interactions.social.social_super_interaction" n="${n}" s="${instanceId}">
  <T n="display_name">${toStblRef(nameHash)}</T>
  <L n="interaction_category_tags">
    <E>Interaction_Chat</E>
    <E>Interaction_SocialAll</E>
  </L>
  <E n="target_type">TARGET</E>
  <L n="test_globals">
    <V t="sim_info">
      <U n="sim_info">
        <V n="ages" t="specified">
          <L n="specified">
            <E>TEEN</E>
            <E>YOUNGADULT</E>
            <E>ADULT</E>
            <E>ELDER</E>
          </L>
        </V>
      </U>
    </V>
  </L>
  <V n="outcome" t="test_based">
    <U n="test_based">
      <L n="tested_outcomes">
        <U>
          <L n="potential_outcomes">
            <U>
              <U n="outcome">
                <L n="loot_list">
                  ${data.loot_on_success ? `<T>${getInstanceId(data.loot_on_success, allElements)}</T>` : ''}
                </L>
              </U>
              <U n="weight">
                <T n="base_value">${data.success_weight || 100}</T>
              </U>
            </U>
          </L>
        </U>
      </L>
    </U>
  </V>
  ${data.animation_ref ? `<U n="basic_content"><V n="content" t="one_shot"><U n="one_shot"><U n="animation_ref"><T n="factory">${data.animation_ref}</T></U></U></V></U>` : ''}
</I>`.trim();
}

/**
 * Serializes a SuperInteraction element to XML.
 */
function serializeSuperInteraction(el: ModElement, strings: Record<number, string>, allElements: ModElement[]): string {
  const data = el.data;
  const instanceId = getInstanceId(el, allElements);
  const n = getTuningName(el);

  const nameHash = fnv32(data.display_name || '');
  strings[nameHash] = data.display_name || '';

  return `<?xml version="1.0" encoding="utf-8"?>
<I c="SuperInteraction" i="interaction" m="interactions.base.super_interaction" n="${n}" s="${instanceId}">
  <T n="display_name">${toStblRef(nameHash)}</T>
  <E n="target_type">OBJECT</E>
  <L n="test_globals" />
  <T n="allow_autonomous">${data.allow_autonomous !== false ? 'True' : 'False'}</T>
  <V n="outcome" t="single">
    <U n="single">
      <U n="outcome">
        <L n="loot_list">
          ${data.outcome_loot ? `<T>${getInstanceId(data.outcome_loot, allElements)}</T>` : ''}
        </L>
      </U>
    </U>
  </V>
</I>`.trim();
}

/**
 * Serializes an Action Trigger element.
 */
function serializeActionTrigger(el: ModElement, allElements: ModElement[]): string {
  const data = el.data;
  const instanceId = getInstanceId(el, allElements);
  const n = getTuningName(el);

  return `<?xml version="1.0" encoding="utf-8"?>
<I c="ActionTrigger" i="action" m="interactions.utils.action_trigger" n="${n}" s="${instanceId}">
  <E n="trigger_type">${data.trigger_type || 'ON_BUFF_ADD'}</E>
  ${data.trigger_target_ref ? `<T n="trigger_target">${getInstanceId(data.trigger_target_ref, allElements)}</T>` : ''}
  ${data.threshold ? `<T n="threshold">${data.threshold}</T>` : ''}
  <L n="loot_list">
    ${data.loot_list ? `<T>${getInstanceId(data.loot_list, allElements)}</T>` : ''}
  </L>
</I>`.trim();
}

/**
 * Serializes an XML Injector Snippet.
 */
function serializeXmlInjector(el: ModElement, allElements: ModElement[]): string {
  const data = el.data;
  const instanceId = getInstanceId(el, allElements);
  const n = getTuningName(el);

  let injectionXml = '';
  const affordanceId = data.affordance_ref ? getInstanceId(data.affordance_ref, allElements) : '0';

  if (data.injection_type === 'object_affordance') {
    injectionXml = `
    <L n="add_interactions">
      <U>
        <L n="affordances">
          <T>${affordanceId}</T>
        </L>
        <L n="object_selection">
          <V t="object_definition">
            <U n="object_definition">
              <L n="object_definitions">
                <T>${data.target_object_id || '0'}</T>
              </L>
            </U>
          </V>
        </L>
      </U>
    </L>`;
  } else if (data.injection_type === 'sim_affordance') {
    injectionXml = `
    <L n="add_interactions">
      <U>
        <L n="affordances">
          <T>${affordanceId}</T>
        </L>
        <L n="sim_selection">
          <V t="all_sims" />
        </L>
      </U>
    </L>`;
  } else if (data.injection_type === 'computer_affordance') {
    injectionXml = `
    <L n="add_interactions">
      <U>
        <L n="affordances">
          <T>${affordanceId}</T>
        </L>
        <L n="object_selection">
          <V t="object_tags">
            <U n="object_tags">
              <L n="tags">
                <E>Func_Computer</E>
              </L>
            </U>
          </V>
        </L>
      </U>
    </L>`;
  } else if (data.injection_type === 'phone_affordance') {
    injectionXml = `
    <L n="phone_affordances">
      <T>${affordanceId}</T>
    </L>`;
  }

  return `<?xml version="1.0" encoding="utf-8"?>
<I c="XmlInjector" i="snippet" m="xml_injector.injector" n="${n}" s="${instanceId}">
  ${injectionXml}
</I>`.trim();
}

/**
 * Main export pipeline.
 */
export function runExportPipeline(elements: ModElement[]): DBPFResource[] {
  const strings: Record<number, string> = {};
  const resources: DBPFResource[] = [];
  const encoder = new TextEncoder();
  const instanceMap: Record<string, string> = {}; // instanceId -> internal_name

  // Process elements
  elements.forEach(el => {
    let xml = '';
    let simDataBytes: Uint8Array | undefined;
    let typeId = 0x6017E896; // Tuning

    const instanceId = getInstanceId(el, elements).toString();
    const displayName = el.data.internal_name || el.id;

    if (instanceMap[instanceId]) {
      console.warn(`[Collision] Elements "${instanceMap[instanceId]}" and "${displayName}" have the same instance ID: ${instanceId}. This WILL cause game issues!`);
    }
    instanceMap[instanceId] = displayName;

    if (el.type === 'Trait') {
      const result = serializeTrait(el, strings, elements);
      xml = result.xml;
      simDataBytes = result.simData;
      typeId = 0xCB5FDDC7;
    } else if (el.type === 'Buff') {
      const result = serializeBuff(el, strings, elements);
      xml = result.xml;
      simDataBytes = result.simData;
      typeId = 0x6017E896;
    } else if (el.type === 'Commodity' || el.type === 'Statistic') {
      xml = serializeCommodity(el, elements);
      typeId = 0x339BC5BD;
    } else if (el.type === 'MixerInteraction') {
      xml = serializeMixer(el, strings, elements);
      typeId = 0x6017E896;
    } else if (el.type === 'SocialInteraction') {
      xml = serializeSocial(el, strings, elements);
      typeId = 0xE882D22F;
    } else if (el.type === 'SuperInteraction') {
      xml = serializeSuperInteraction(el, strings, elements);
      typeId = 0xE882D22F;
    } else if (el.type === 'ActionTrigger') {
      xml = serializeActionTrigger(el, elements);
      typeId = 0x6017E896;
    } else if (el.type === 'XmlInjectorSnippet') {
      xml = serializeXmlInjector(el, elements);
      typeId = 0x7E912205; // Snippet
    } else if (el.type === 'LootActionSet') {
      xml = serializeLoot(el, strings, elements);
      typeId = 0x0C772E27; // LootActions
    }

    if (xml) {
      resources.push({
        typeId,
        groupId: 0,
        instanceId: getInstanceId(el, elements),
        data: encoder.encode(xml)
      });

      if (simDataBytes) {
        resources.push({
          typeId: 0x545AC67A, // SimData
          groupId: 0x00B2D882, // Standard SimData Group for Tuning
          instanceId: getInstanceId(el, elements),
          data: simDataBytes
        });
      }
    }
  });

  // AUTO-INJECTION logic for MixerInteractions
  const mixers = elements.filter(el => el.type === 'MixerInteraction');
  if (mixers.length > 0) {
    // 1. Create an AffordanceList snippet containing all mixers
    const listInstanceId = fnv64('ModBee:MixerList');
    const listXml = `<?xml version="1.0" encoding="utf-8"?>
<I c="Snippet" i="snippet" m="snippets.affordance_list" n="ModBee:AffordanceList" s="${listInstanceId}">
  <L n="affordances">
    ${mixers.map(m => `<T>${getInstanceId(m, elements)}</T>`).join('\n    ')}
  </L>
</I>`;
    resources.push({
      typeId: 0x7E912205,
      groupId: 0,
      instanceId: listInstanceId,
      data: encoder.encode(listXml)
    });

    // 2. Create XML Injector snippets to wire this list into EA's social mixers
    // Real social mixer target snippets (Friendly, Funny, Flirty, Mean)
    const socialSnippetTargets = [
      0x00000000D8A5A66Cn, // social_Mixers_Friendly_NonTouching
      0x000000005C72E9D0n, // social_Mixers_Funny
      0x000000005F99B7A6n, // social_Mixers_Flirty
      0x00000000D94A6E78n  // social_Mixers_Mean
    ];

    socialSnippetTargets.forEach((targetId, idx) => {
      const injectId = fnv64(`ModBee:MixerInject_${idx}`);
      const injectXml = `<?xml version="1.0" encoding="utf-8"?>
<I c="XmlInjector" i="snippet" m="xml_injector.injector" n="ModBee:MixerInject_${idx}" s="${injectId}">
  <L n="add_to_affordance_list">
    <U>
      <T n="affordance_list">${targetId.toString()}</T>
      <L n="affordances">
        ${mixers.map(m => `<T>${getInstanceId(m, elements)}</T>`).join('\n        ')}
      </L>
    </U>
  </L>
</I>`;
      resources.push({
        typeId: 0x7E912205,
        groupId: 0,
        instanceId: injectId,
        data: encoder.encode(injectXml)
      });
    });
  }

  // Add STBL
  const stblData = createStbl(strings);
  resources.push({
    typeId: 0x220557DA,
    groupId: 0x80000000,
    instanceId: fnv64('ShaunnaBeeSims:en-US'),
    data: stblData
  });

  return resources;
}
