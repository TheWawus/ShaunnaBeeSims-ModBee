import JSZip from 'jszip';

/**
 * Generates the Python injection script for Mixer Interactions.
 */
export function generatePythonScript(modName: string, snippetId: number, mixerInstanceIds: bigint[] | string[]): string {
  const mixerIdsTuple = `(${mixerInstanceIds.map(id => id.toString()).join(', ')})`;
  const functionName = `${modName.replace(/\s+/g, '_')}_AddMixer_${snippetId}`;

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

SNIPPET_ID = ${snippetId}
MIXER_IDS = ${mixerIdsTuple}

@inject_to(InstanceManager, 'load_data_into_class_instances')
def ${functionName}(original, self, packs_to_load=None):
    original(self, packs_to_load)
    if self.TYPE == Types.SNIPPET:
        key = sims4.resources.get_resource_key(SNIPPET_ID, Types.SNIPPET)
        snippet_tuning = self._tuned_classes.get(key)
        if snippet_tuning is None:
            return
        for m_id in MIXER_IDS:
            affordance_manager = services.affordance_manager()
            key = sims4.resources.get_resource_key(m_id, Types.INTERACTION)
            mixer_tuning = affordance_manager.get(key)
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
