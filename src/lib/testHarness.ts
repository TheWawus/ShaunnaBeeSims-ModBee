import { fnv64, stblKeyFromString } from './hash';
import { generateTraitXml } from './generators/traitXml';
import { generateBuffXml } from './generators/buffXml';
import { generateSTBL } from './generators/stbl';
import { buildPackage, downloadPackage } from './dbpf';
import { DBPFResource } from '../types';

/**
 * Proof of Concept: Builds a test package with a custom trait and buff.
 */
export async function buildTestPackage() {
  const modName = 'AgentModTest';
  const traitName = `${modName}_NightOwl`;
  const buffName = `${modName}_NightBurst`;
  
  const traitDisplayName = 'Night Owl';
  const traitDescription = 'Thrives when the sun goes down.';
  const buffDisplayName = 'Burst of Energy';
  const buffDescription = 'The moon gives you strength!';

  const strings: Record<number, string> = {
    [stblKeyFromString(traitDisplayName)]: traitDisplayName,
    [stblKeyFromString(traitDescription)]: traitDescription,
    [stblKeyFromString(buffDisplayName)]: buffDisplayName,
    [stblKeyFromString(buffDescription)]: buffDescription,
  };

  const stblEntries = Object.entries(strings).map(([key, value]) => ({
    key: parseInt(key, 10),
    value
  }));

  const traitId = `Trait_${fnv64(traitName).toString()}`;
  const buffId = `Buff_${fnv64(buffName).toString()}`;

  const traitXml = generateTraitXml({
    id: traitId,
    type: 'Trait',
    data: {
      internal_name: traitName,
      display_name: traitDisplayName,
      trait_description: traitDescription,
      trait_type: 'PERSONALITY',
      permanent_buff: buffId
    }
  });

  const buffXml = generateBuffXml({
    id: buffId,
    type: 'Buff',
    data: {
      buff_name: buffDisplayName,
      buff_description: buffDescription,
      mood_type: 'Energized',
      mood_weight: 2,
      duration: 14400,
      visible: true
    }
  });

  const encoder = new TextEncoder();
  const resources: DBPFResource[] = [
    {
      typeId: 0x6017E896,
      groupId: 0,
      instanceId: fnv64(traitName),
      data: encoder.encode(traitXml)
    },
    {
      typeId: 0x6017E896,
      groupId: 0,
      instanceId: fnv64(buffName),
      data: encoder.encode(buffXml)
    },
    {
      typeId: 0x220557DA, // TS4 STBL
      groupId: 0x80000000, // Common group for STBLs
      instanceId: (fnv64(`${modName}:en-US`) & 0x00FFFFFFFFFFFFFFn) | 0x0700000000000000n,
      data: generateSTBL(stblEntries)
    }
  ];

  const pkgData = buildPackage(resources);
  downloadPackage(pkgData, `${modName}.package`);
}

/**
 * Adds a test button to the UI in dev mode.
 */
export function initDevTest() {
  if ((import.meta as any).env?.DEV) {
    const btn = document.createElement('button');
    btn.innerText = 'Download Test Package';
    btn.style.position = 'fixed';
    btn.style.bottom = '10px';
    btn.style.right = '10px';
    btn.style.zIndex = '9999';
    btn.onclick = buildTestPackage;
    document.body.appendChild(btn);
  }
}
