import { ModElement } from '../types';

/**
 * Resolves the most descriptive name for a mod element.
 * Prioritizes user-facing display names over internal identifiers.
 */
export function getElementDisplayName(el: ModElement): string {
  const data = el.data;
  
  // Specific fields based on type
  return (
    data.buff_name || 
    data.trait_name ||
    data.display_name || 
    data.career_name ||
    data.filter_name ||
    data.objective_name ||
    data.name || // Some types use generic 'name'
    data.internal_name || // Last resort if specifically set
    (el.type === 'LootActionSet' ? 'Loot' : '') || // Default for some types
    `Untitled ${el.type}`
  );
}

/**
 * Clean version of internal name for display (e.g. Creator_Mod:Buff_Name -> Buff Name)
 */
export function formatInternalName(internalName?: string): string {
  if (!internalName) return '';
  const parts = internalName.split(':');
  const lastPart = parts[parts.length - 1];
  return lastPart
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^ /, '')
    .trim();
}
