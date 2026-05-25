import { fnv64 } from '../hash';

/**
 * Generates Buff Tuning XML for The Sims 4.
 */
export function generateBuffXml(buff: any): string {
  const data = buff.data;
  const instanceIdString = buff.id.split('_').pop() || fnv64(data.buff_name || buff.id).toString();
  const instanceId = instanceIdString;
  
  const durationElement = data.duration && data.duration > 0
    ? `<V n="_temporary_commodity_info" t="enabled">
        <U n="enabled">
          <T n="max_duration">${data.duration}</T>
        </U>
      </V>`
    : '';

  const modifiers = data.modifiers ? (Array.isArray(data.modifiers) ? data.modifiers : [data.modifiers]).map((m: any) => `
    <U>
      <T n="key">${m.stat || m}</T>
      <T n="value">${m.value || 1}</T>
    </U>`).join('') : '';

  return `<?xml version="1.0" encoding="utf-8"?>
<I c="Buff" i="buff" m="buffs.buff" n="${data.buff_name || buff.id}" s="${instanceId}">
  <T n="buff_description">${data.buff_description ? '0x' + fnv64(data.buff_description).toString(16).toUpperCase() : '0x00000000'}</T>
  <T n="buff_name">${data.buff_name ? '0x' + fnv64(data.buff_name).toString(16).toUpperCase() : '0x00000000'}</T>
  <T n="icon">${data.icon || '00000000:00000000:0000000000000000'}</T>
  ${data.mood_type ? `<T n="mood_type">${data.mood_type}</T>` : ''}
  <T n="mood_weight">${data.mood_weight || 1}</T>
  ${durationElement}
  ${data.buff_reason ? `<T n="buff_reason">0x${fnv64(data.buff_reason).toString(16).toUpperCase()}</T>` : ''}
  ${modifiers ? `<L n="gameplay_modifiers">${modifiers}\n  </L>` : ''}
  <T n="visible">${data.visible !== false ? 'True' : 'False'}</T>
</I>`;
}
