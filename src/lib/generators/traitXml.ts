import { fnv64 } from '../hash';

/**
 * Generates Trait Tuning XML for The Sims 4.
 */
export function generateTraitXml(trait: any): string {
  const data = trait.data;
  const instanceIdString = trait.id.split('_').pop() || fnv64(data.internal_name || trait.id).toString();
  const instanceId = instanceIdString.startsWith('0x') ? instanceIdString : instanceIdString; // Keep as is, it's used in template direct
  
  const ages = data.ages || ['ADULT', 'YOUNGADULT', 'ELDER', 'TEEN'];
  const ageElements = ages.map((age: string) => `<E>${age}</E>`).join('\n    ');

  const conflicts = data.conflicting_traits ? (Array.isArray(data.conflicting_traits) ? data.conflicting_traits : [data.conflicting_traits]).map((t: any) => `<T>${t}</T>`).join('\n    ') : '';
  const tags = data.tags ? (Array.isArray(data.tags) ? data.tags : [data.tags]).map((tag: string) => `<E>${tag}</E>`).join('\n    ') : '';

  return `<?xml version="1.0" encoding="utf-8"?>
<I c="Trait" i="trait" m="traits.traits" n="${data.internal_name || trait.id}" s="${instanceId}">
  <L n="ages">
    ${ageElements}
  </L>
  <L n="buffs">
    ${data.permanent_buff ? `
    <U>
      <T n="buff_type">${data.permanent_buff}</T>
    </U>` : ''}
  </L>
  <T n="display_name">${data.display_name ? '0x' + fnv64(data.display_name).toString(16).toUpperCase() : '0x00000000'}</T>
  <T n="icon">${data.icon || '00000000:00000000:0000000000000000'}</T>
  ${data.disable_aging ? `<V n="disable_aging" t="enabled" />` : ''}
  ${conflicts ? `<L n="conflicting_traits">\n    ${conflicts}\n  </L>` : ''}
  ${tags ? `<L n="tags">\n    ${tags}\n  </L>` : ''}
  <T n="trait_description">${data.trait_description ? '0x' + fnv64(data.trait_description).toString(16).toUpperCase() : '0x00000000'}</T>
  ${data.trait_origin_description ? `<T n="trait_origin_description">0x${fnv64(data.trait_origin_description).toString(16).toUpperCase()}</T>` : ''}
  <E n="trait_type">${data.trait_type || 'PERSONALITY'}</E>
  ${data.voice_effect ? `<V n="voice_effect" t="enabled"><U n="enabled"><E n="voice_effect">${data.voice_effect}</E></U></V>` : ''}
</I>`;
}
