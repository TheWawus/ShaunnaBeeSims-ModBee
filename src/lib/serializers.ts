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
function getInstanceId(el: ModElement): bigint {
  // If el.id ends with a large number (likely from an import), try to use it
  const match = el.id.match(/_(\d+)$/);
  if (match) {
    try {
      return BigInt(match[1]);
    } catch (e) { /* ignore */ }
  }
  
  // Otherwise, hash the internal name or ID
  const nameToHash = el.data.internal_name || el.id;
  return fnv64(nameToHash);
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
function serializeTrait(el: ModElement, strings: Record<number, string>): { xml: string, simData?: Uint8Array } {
  const data = el.data;
  const instanceId = getInstanceId(el);
  const n = getTuningName(el);
  
  const nameHash = fnv32(data.trait_name || data.display_name || '');
  strings[nameHash] = data.trait_name || data.display_name || '';
  
  const descHash = fnv32(data.trait_description || '');
  strings[descHash] = data.trait_description || '';

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<I c="Trait" i="trait" m="traits.traits" n="${n}" s="${instanceId}">
  <T n="display_name">${toStblRef(nameHash)}</T>
  <T n="trait_description">${toStblRef(descHash)}</T>
  <E n="trait_type">${data.trait_type || 'PERSONALITY'}</E>
  <L n="ages">
    ${(data.ages || ['YOUNGADULT', 'ADULT', 'ELDER']).map((age: string) => `<E>${age}</E>`).join('\n    ')}
  </L>
  <V n="ui_category" t="ui_trait_category_tag" />
  ${data.permanent_buff ? `<T n="permanent_buff">${getInstanceId({ id: data.permanent_buff, type: 'Buff', data: {} } as any)}</T>` : ''}
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
function serializeBuff(el: ModElement, strings: Record<number, string>): { xml: string, simData?: Uint8Array } {
  const data = el.data;
  const instanceId = getInstanceId(el);
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
function serializeCommodity(el: ModElement): string {
  const data = el.data;
  const instanceId = getInstanceId(el);
  const n = getTuningName(el);

  return `<?xml version="1.0" encoding="utf-8"?>
<I c="Commodity" i="statistic" m="statistics.commodity" n="${n}" s="${instanceId}">
  <T n="_default_convergence_value">0</T>
  <T n="decay_rate">${data.decay_rate || 1}</T>
  <U n="initial_tuning">
    <T n="_value">${data.initial_value || 10}</T>
  </U>
  <T n="min_value_tuning">${data.min_value || 0}</T>
  <T n="max_value_tuning">${data.max_value || 10}</T>
  <L n="states" />
</I>`.trim();
}

/**
 * Serializes a LootActionSet element to XML.
 */
function serializeLoot(el: ModElement, strings: Record<number, string>): string {
  const data = el.data;
  const instanceId = getInstanceId(el);
  const n = getTuningName(el);

  let lootActionXml = '';
  switch (data.variant) {
    case 'buff':
      if (data.buff_ref) {
        lootActionXml = `
    <V t="buff">
      <U n="buff">
        <U n="buff">
          <T n="buff_type">${getInstanceId({ id: data.buff_ref, type: 'Buff', data: {} } as any)}</T>
        </U>
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
          <T>${getInstanceId({ id: data.buff_ref, type: 'Buff', data: {} } as any)}</T>
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
          <T n="stat">${getInstanceId({ id: data.stat_ref, type: 'Commodity', data: {} } as any)}</T>
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
        <T n="trait">${getInstanceId({ id: data.trait_ref, type: 'Trait', data: {} } as any)}</T>
      </U>
    </V>`;
      }
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
function serializeMixer(el: ModElement, strings: Record<number, string>): string {
  const data = el.data;
  const instanceId = getInstanceId(el);
  const n = getTuningName(el);

  const nameHash = fnv32(data.display_name || '');
  strings[nameHash] = data.display_name || '';

  return `<?xml version="1.0" encoding="utf-8"?>
<I c="SocialMixerInteraction" i="interaction" m="interactions.social.social_mixer_interaction" n="${n}" s="${instanceId}">
  <T n="display_name">${toStblRef(nameHash)}</T>
  <V n="outcome" t="single">
    <U n="single">
      <U n="outcome">
        <L n="loot_list">
          ${data.loot_on_completion ? `<T>${getInstanceId({ id: data.loot_on_completion, type: 'LootActionSet', data: {} } as any)}</T>` : ''}
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
function serializeSocial(el: ModElement, strings: Record<number, string>): string {
  const data = el.data;
  const instanceId = getInstanceId(el);
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
</I>`.trim();
}

/**
 * Serializes an XML Injector Snippet.
 */
function serializeXmlInjector(el: ModElement): string {
  const data = el.data;
  const instanceId = getInstanceId(el);
  const n = getTuningName(el);

  let injectionXml = '';
  const affordanceId = data.affordance_ref ? getInstanceId({ id: data.affordance_ref, type: 'SocialInteraction', data: {} } as any) : '0';

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

  elements.forEach(el => {
    let xml = '';
    let simDataBytes: Uint8Array | undefined;
    let typeId = 0x6017E896; // Tuning

    if (el.type === 'Trait') {
      const result = serializeTrait(el, strings);
      xml = result.xml;
      simDataBytes = result.simData;
      typeId = 0xCB5FDDC7;
    } else if (el.type === 'Buff') {
      const result = serializeBuff(el, strings);
      xml = result.xml;
      simDataBytes = result.simData;
      typeId = 0x6017E896;
    } else if (el.type === 'Commodity' || el.type === 'Statistic') {
      xml = serializeCommodity(el);
      typeId = 0x339BC5BD;
    } else if (el.type === 'MixerInteraction') {
      xml = serializeMixer(el, strings);
      typeId = 0x6017E896;
    } else if (el.type === 'SocialInteraction') {
      xml = serializeSocial(el, strings);
      typeId = 0xE882D22F;
    } else if (el.type === 'XmlInjectorSnippet') {
      xml = serializeXmlInjector(el);
      typeId = 0x7E912205; // Snippet
    } else if (el.type === 'LootActionSet') {
      xml = serializeLoot(el, strings);
      typeId = 0x6017E896;
    }

    if (xml) {
      resources.push({
        typeId,
        groupId: 0,
        instanceId: getInstanceId(el),
        data: encoder.encode(xml)
      });

      if (simDataBytes) {
        resources.push({
          typeId: 0x545AC67A, // SimData
          groupId: 0x006456D7, // SimData Group (TS4 standard)
          instanceId: getInstanceId(el),
          data: simDataBytes
        });
      }
    }
  });

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
