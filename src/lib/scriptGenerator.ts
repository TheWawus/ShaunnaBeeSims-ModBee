import JSZip from 'jszip';

/**
 * Generates the Python injection script for multiple Snippet -> Mixer mappings.
 */
export function generatePythonScript(modName: string, injections: { snippetId: number | string; mixerIds: (number | bigint | string)[] }[]): string {
  if (injections.length === 0) return '';
  
  const injectionData = injections.map(inj => {
    const mixerIdsTuple = `(${inj.mixerIds.map(id => id.toString()).join(', ')})`;
    return `    ${inj.snippetId}: ${mixerIdsTuple},`;
  }).join('\n');

  const functionName = `${modName.replace(/\s+/g, '_')}_Injection`;

  return `
from functools import wraps
import services
import sims4.resources
from sims4.tuning.instance_manager import InstanceManager
from sims4.resources import Types

def inject(target_function, new_function):
    @wraps(target_function)
    def _inject(*args, **kwargs):
        return new_function(target_function, *args, **kwargs)
    return _inject

def inject_to(target_object, target_function_name):
    def _inject_to(new_function):
        target_function = getattr(target_object, target_function_name)
        setattr(target_object, target_function_name, inject(target_function, new_function))
        return new_function
    return _inject_to

# Mapping of Snippet ID -> List of Mixer Interaction IDs
INJECTION_MAP = {
${injectionData}
}

@inject_to(InstanceManager, 'load_data_into_class_instances')
def ${functionName}(original, self, packs_to_load=None):
    original(self, packs_to_load)
    if self.TYPE == Types.SNIPPET:
        affordance_manager = services.affordance_manager()
        for s_id, mixer_ids in INJECTION_MAP.items():
            key = sims4.resources.get_resource_key(s_id, Types.SNIPPET)
            snippet_tuning = self._tuned_classes.get(key)
            if snippet_tuning is None:
                continue
            for m_id in mixer_ids:
                m_key = sims4.resources.get_resource_key(m_id, Types.INTERACTION)
                mixer_tuning = affordance_manager.get(m_key)
                if mixer_tuning is None:
                    continue
                if mixer_tuning in snippet_tuning.value:
                    continue
                snippet_tuning.value = snippet_tuning.value + (mixer_tuning,)
`.trim();
}

/**
 * Packs the Python script into a .ts4script (ZIP) file.
 */
export async function createTs4Script(modName: string, pythonContent: string): Promise<Uint8Array> {
  const zip = new JSZip();
  zip.file(`${modName}.py`, pythonContent);
  return await zip.generateAsync({ type: 'uint8array' });
}
