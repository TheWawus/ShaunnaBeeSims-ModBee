/**
 * ModUpdater.tsx
 * ──────────────────────────────────────────────────────────────────────────────
 * "Update your mods" feature for ModBee.
 */

import React, { useState, useCallback, useRef } from 'react';
import { parsePackage, buildPackage } from '../lib/dbpf';
import type { DBPFResource } from '../types';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Proxy URL. Using a public CORS proxy to avoid browser-side blocking. */
const CORS_PROXY = 'https://corsproxy.io/?url=';
const TDESC_BASE = 'https://tdesc.lot51.cc'; 

/** Resource type IDs that contain tuning XML */
const TUNING_TYPE_IDS = new Set([
  0x6017E896, // Generic tuning
  0xCB5FDDC7, // Trait
  0xE882D22F, // Social interaction
  0x7E912205, // Snippet (XML Injector)
  0x339BC5BD, // Statistic / Commodity
]);

/** Map from (c= attribute) → tdesc URL segments. */
const CLASS_TO_TDESC: Record<string, { dir: string; file: string }[]> = {
  Trait:                   [{ dir: 'Traits',       file: 'Trait'                   }],
  Buff:                    [{ dir: 'Buffs',         file: 'Buff'                    }],
  Commodity:               [{ dir: 'Statistics',    file: 'Commodity'               }],
  LootActions:             [{ dir: 'Interactions',  file: 'LootActions'             }],
  SocialSuperInteraction:  [{ dir: 'Interactions',  file: 'SocialSuperInteraction'  }],
  SocialMixerInteraction:  [{ dir: 'Interactions',  file: 'SocialMixerInteraction'  }],
  XmlInjector:             [{ dir: 'Contrib',       file: 'XmlInjector'             }],
  SuperInteraction:        [{ dir: 'Interactions',  file: 'SuperInteraction'        }],
  MixerInteraction:        [{ dir: 'Interactions',  file: 'MixerInteraction'        }],
  Interaction:             [{ dir: 'Interactions',  file: 'Interaction'             }],
  Aspiration:              [{ dir: 'Aspirations',   file: 'Aspiration'              }],
  Career:                  [{ dir: 'Careers',       file: 'Career'                  }],
  RelationshipBit:         [{ dir: 'Relationships', file: 'RelationshipBit'         }],
  Situation:               [{ dir: 'Situations',    file: 'Situation'               }],
  SituationJob:            [{ dir: 'Situations',    file: 'SituationJob'            }],
  Recipe:                  [{ dir: 'Recipes',       file: 'Recipe'                  }],
  ObjectDefinition:        [{ dir: 'Objects',       file: 'ObjectDefinition'        }],
  ObjectState:             [{ dir: 'Objects',       file: 'ObjectState'             }],
  Snippet:                 [{ dir: 'Snippets',      file: 'Snippet'                 }],
  Module:                  [{ dir: 'Modules',       file: 'Module'                  }],
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface TunedResource {
  resource: DBPFResource;
  className: string;            
  modulePath: string;           
  tuningName: string;           
  instanceId: string;           
  rawXml: string;
  dom: Document;
}

interface TdescField {
  name: string;
  type: 'T' | 'E' | 'L' | 'U' | 'V' | 'unknown'; 
  required: boolean;
  enumValues?: string[];         
  description?: string;
}

interface TdescSchema {
  className: string;
  fields: TdescField[];
  allValidNames: Set<string>;
  rawTdesc: string;
}

export type IssueKind =
  | 'deprecated_field'      
  | 'invalid_enum_value'    
  | 'missing_required'      
  | 'type_mismatch';        

export interface TuningIssue {
  kind: IssueKind;
  fieldName: string;
  currentValue?: string;
  suggestedValue?: string;
  validOptions?: string[];
  message: string;
  autoFixable: boolean;
}

interface ResourceReport {
  resource: TunedResource;
  schema: TdescSchema | null;
  issues: TuningIssue[];
  patchedXml: string;
  approved: Set<number>;     
  rejected: Set<number>;
}

type StepKind = 'drop' | 'scanning' | 'review' | 'exporting' | 'done' | 'error';

// ─── TDESC fetching & parsing ─────────────────────────────────────────────────

const tdescCache = new Map<string, TdescSchema | null>();

async function fetchTdesc(className: string): Promise<TdescSchema | null> {
  if (tdescCache.has(className)) return tdescCache.get(className)!;

  const candidates = CLASS_TO_TDESC[className];
  
  const tryUrl = async (url: string) => {
    try {
      const proxiedUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;
      const res = await fetch(proxiedUrl);
      if (!res.ok) return null;
      const text = await res.text();
      if (!text.includes('<I')) return null; // Simple check if it's XML
      return parseTdesc(className, text);
    } catch {
      return null;
    }
  };

  if (candidates) {
    for (const { dir, file } of candidates) {
      const url = `${TDESC_BASE}/${dir}/Descriptions/${file}.tdesc`;
      const schema = await tryUrl(url);
      if (schema) {
        tdescCache.set(className, schema);
        return schema;
      }
    }
  }

  // Fallback: try the /Tuning/ path pattern with lowercase class
  const fallbackUrl = `${TDESC_BASE}/Tuning/${className.toLowerCase()}.tdesc`;
  const fallbackSchema = await tryUrl(fallbackUrl);
  if (fallbackSchema) {
    tdescCache.set(className, fallbackSchema);
    return fallbackSchema;
  }

  // Try just /Tuning/Class.tdesc
  const fallbackUrl2 = `${TDESC_BASE}/Tuning/${className}.tdesc`;
  const fallbackSchema2 = await tryUrl(fallbackUrl2);
  if (fallbackSchema2) {
    tdescCache.set(className, fallbackSchema2);
    return fallbackSchema2;
  }

  tdescCache.set(className, null);
  return null;
}

function parseTdesc(className: string, xml: string): TdescSchema {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const fields: TdescField[] = [];
  const allValidNames = new Set<string>();

  // Helper to walk TDESC and collect all tunable names
  const walk = (el: Element) => {
    for (const child of Array.from(el.children)) {
      const name = child.getAttribute('n');
      if (name) allValidNames.add(name);
      walk(child);
    }
  };

  const root = doc.querySelector('I');
  if (root) {
    walk(root);
    for (const child of Array.from(root.children)) {
      const tag = child.tagName as TdescField['type'];
      const name = child.getAttribute('n');
      if (!name) continue;

      const field: TdescField = {
        name,
        type: (['T','E','L','U','V'].includes(tag) ? tag : 'unknown') as TdescField['type'],
        required: child.getAttribute('optional') !== 'True',
        description: child.getAttribute('description') ?? undefined,
      };

      if (tag === 'E') {
        const enumItems = Array.from(child.querySelectorAll('enum_item'))
          .map(el => el.getAttribute('value') ?? el.textContent?.trim() ?? '')
          .filter(Boolean);
        if (enumItems.length) field.enumValues = enumItems;
      }

      fields.push(field);
    }
  }

  return { className, fields, allValidNames, rawTdesc: xml };
}

// ─── DBPF → TunedResource extraction ─────────────────────────────────────────

function extractTuningResources(resources: DBPFResource[]): TunedResource[] {
  const decoder = new TextDecoder();
  const results: TunedResource[] = [];
  const parser = new DOMParser();

  for (const res of resources) {
    if (!TUNING_TYPE_IDS.has(res.typeId)) continue;

    let text: string;
    try {
      text = decoder.decode(res.data);
    } catch { continue; }

    if (!text.startsWith('<?xml') && !text.startsWith('<I')) continue;

    let dom: Document;
    try {
      dom = parser.parseFromString(text, 'text/xml');
    } catch { continue; }

    const root = dom.querySelector('I');
    if (!root) continue;

    const className  = root.getAttribute('c') ?? '';
    const modulePath = root.getAttribute('m') ?? '';
    const tuningName = root.getAttribute('n') ?? '';
    const instanceId = root.getAttribute('s') ?? '';

    if (!className) continue;

    results.push({ resource: res, className, modulePath, tuningName, instanceId, rawXml: text, dom });
  }

  return results;
}

// ─── Deterministic diffing ────────────────────────────────────────────────────

function diffTuning(tuned: TunedResource, schema: TdescSchema): TuningIssue[] {
  const issues: TuningIssue[] = [];
  const root = tuned.dom.querySelector('I');
  if (!root) return issues;

  // Global set of valid names from TDESC
  const validNames = schema.allValidNames;

  // Recursive walker to check ALL elements in the tuning XML
  const checkElement = (el: Element) => {
    const n = el.getAttribute('n');
    if (n && !validNames.has(n)) {
      issues.push({
        kind: 'deprecated_field',
        fieldName: n,
        message: `Field "${n}" does not exist in any part of the ${tuned.className} schema. It may be deprecated or a typo.`,
        autoFixable: true,
      });
    }

    // Check enum values for E type elements if they match top-level or known types
    // (This is heuristic as we don't have full type context per-node, 
    // but we can check if the field name matches a known enum field in the schema)
    if (el.tagName === 'E' && n) {
      const schemaField = schema.fields.find(f => f.name === n);
      if (schemaField && schemaField.type === 'E' && schemaField.enumValues) {
        const val = (el.getAttribute('t') ?? el.textContent ?? '').trim();
        if (val && !schemaField.enumValues.includes(val)) {
           issues.push({
             kind: 'invalid_enum_value',
             fieldName: n,
             currentValue: val,
             validOptions: schemaField.enumValues,
             message: `"${n}" has invalid value "${val}".`,
             autoFixable: false,
           });
        }
      }
    }

    for (const child of Array.from(el.children)) {
      checkElement(child);
    }
  };

  checkElement(root);

  // Check for missing required top-level fields
  const presentTopLevel = new Set(
    Array.from(root.children).map(c => c.getAttribute('n')).filter(Boolean) as string[]
  );

  for (const field of schema.fields) {
    if (field.required && !presentTopLevel.has(field.name)) {
      if (field.type === 'T' || field.type === 'E') {
        issues.push({
          kind: 'missing_required',
          fieldName: field.name,
          suggestedValue: field.enumValues?.[0],
          message: `Required top-level field "${field.name}" is missing.`,
          autoFixable: false,
        });
      }
    }
  }

  return issues;
}

function applyFix(xml: string, issue: TuningIssue): string {
  if (issue.kind !== 'deprecated_field') return xml;

  const escapedName = issue.fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const selfClose = new RegExp(`\\s*<[A-Z]\\s[^>]*n="${escapedName}"[^>]*/>`,'g');
  const paired    = new RegExp(`\\s*<[A-Z]\\s[^>]*n="${escapedName}"[^>]*>[\\s\\S]*?</[A-Z]>`, 'g');
  return xml.replace(selfClose, '').replace(paired, '');
}

function buildPatchedXml(tuned: TunedResource, issues: TuningIssue[], approvedIndices: Set<number>): string {
  let xml = tuned.rawXml;
  issues.forEach((issue, i) => {
    if (approvedIndices.has(i) && issue.autoFixable) {
      xml = applyFix(xml, issue);
    }
  });
  return xml;
}

async function rebuildPackage(
  originalBytes: ArrayBuffer,
  patches: Map<string, Uint8Array>   
): Promise<Uint8Array> {
  const resources = parsePackage(originalBytes);

  const patched = resources.map(r => {
    const key = r.instanceId.toString();
    if (patches.has(key)) {
      return { ...r, data: patches.get(key)! };
    }
    return r;
  });

  return buildPackage(patched);
}

export function ModUpdater({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<StepKind>('drop');
  const [progress, setProgress] = useState({ current: 0, total: 0, label: '' });
  const [reports, setReports] = useState<ResourceReport[]>([]);
  const [activeReport, setActiveReport] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const fileBuffers = useRef<Map<string, ArrayBuffer>>(new Map());

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragOver(false), []);

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files).filter(
      (f: File) => f.name.endsWith('.package') || f.name.endsWith('.ts4script')
    ) as File[];
    if (!files.length) return;

    await processFiles(files);
  }, []);

  const onFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []) as File[];
    if (!files.length) return;
    await processFiles(files);
  }, []);

  async function processFiles(files: File[]) {
    setStep('scanning');
    setProgress({ current: 0, total: files.length, label: 'Reading files…' });

    try {
      const allReports: ResourceReport[] = [];

      for (let fi = 0; fi < files.length; fi++) {
        const file = files[fi];
        setProgress({ current: fi + 1, total: files.length, label: `Parsing ${file.name}…` });

        const buffer = await file.arrayBuffer();
        fileBuffers.current.set(file.name, buffer);

        let resources: DBPFResource[];
        try {
          resources = parsePackage(buffer);
        } catch (err) {
          console.warn(`Failed to parse ${file.name}:`, err);
          continue;
        }

        const tuned = extractTuningResources(resources);

        for (let ri = 0; ri < tuned.length; ri++) {
          const t = tuned[ri];
          setProgress({
            current: ri + 1,
            total: tuned.length,
            label: `Checking ${t.tuningName || t.className} (${ri + 1}/${tuned.length})…`
          });

          let schema: TdescSchema | null = null;
          try {
            schema = await fetchTdesc(t.className);
          } catch { /* schema stays null */ }

          const issues = schema ? diffTuning(t, schema) : [];

          const report: ResourceReport = {
            resource: t,
            schema,
            issues,
            patchedXml: issues.length
              ? buildPatchedXml(t, issues, new Set<number>(
                  issues.map((_iss, i) => (_iss.autoFixable ? i : -1)).filter(i => i >= 0)
                ))
              : t.rawXml,
            approved: new Set<number>(
              issues.map((_iss, i) => (_iss.autoFixable ? i : -1)).filter(i => i >= 0)
            ),
            rejected: new Set<number>(),
          };

          allReports.push(report);
        }
      }

      if (!allReports.length) {
        setErrorMsg('No tuning resources found. Please drop valid .package files.');
        setStep('error');
        return;
      }

      setReports(allReports);
      setActiveReport(0);
      setStep('review');

    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Unknown error during scan.');
      setStep('error');
    }
  }

  function toggleApproval(reportIndex: number, issueIndex: number) {
    setReports(prev => {
      const next = [...prev];
      const r = { ...next[reportIndex] };
      const approved = new Set<number>(r.approved);
      const rejected = new Set<number>(r.rejected);

      if (approved.has(issueIndex)) {
        approved.delete(issueIndex);
        rejected.add(issueIndex);
      } else {
        rejected.delete(issueIndex);
        approved.add(issueIndex);
      }

      r.approved = approved;
      r.rejected = rejected;
      r.patchedXml = buildPatchedXml(r.resource, r.issues, approved);
      next[reportIndex] = r;
      return next;
    });
  }

  function approveAll(reportIndex: number) {
    setReports(prev => {
      const next = [...prev];
      const r = { ...next[reportIndex] };
      const approved = new Set<number>(
        r.issues.map((_iss, i) => (_iss.autoFixable ? i : -1)).filter(midx => midx >= 0)
      );
      r.approved = approved;
      r.rejected = new Set<number>();
      r.patchedXml = buildPatchedXml(r.resource, r.issues, approved);
      next[reportIndex] = r;
      return next;
    });
  }

  async function exportPatched() {
    setStep('exporting');

    try {
      const encoder = new TextEncoder();
      const patches = new Map<string, Uint8Array>();

      for (const report of reports) {
        if (report.approved.size === 0) continue;
        patches.set(
          report.resource.instanceId,
          encoder.encode(report.patchedXml)
        );
      }

      if (!patches.size) {
        setStep('done');
        return;
      }

      for (const [filename, buffer] of fileBuffers.current) {
        const patched = await rebuildPackage(buffer, patches);
        downloadBytes(patched, filename.replace('.package', '_updated.package'));
      }

      setStep('done');
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Export failed.');
      setStep('error');
    }
  }

  function downloadBytes(data: Uint8Array, filename: string) {
    const blob = new Blob([data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const totalIssues   = reports.reduce((n, r) => n + r.issues.length, 0);
  const totalFixed    = reports.reduce((n, r) => n + r.approved.size, 0);
  const cleanReports  = reports.filter(r => r.issues.length === 0);
  const issuedReports = reports.filter(r => r.issues.length > 0);

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
      <div className="w-full max-w-5xl bg-white border-[8px] border-[var(--color-border)] rounded-[4rem] shadow-2xl p-12 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-[var(--color-tertiary)] uppercase tracking-tight">Batch Mod Updater</h1>
            <p className="text-lg opacity-60 font-medium">Verify your mods against the latest game patch tuning schemas.</p>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
          >
            Exit
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
          {/* ── STEP: Drop ── */}
          {step === 'drop' && (
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`border-4 border-dashed rounded-[3rem] p-20 text-center transition-all cursor-pointer ${
                isDragOver ? 'border-[var(--color-tertiary)] bg-[var(--color-bg-primary)]' : 'border-[var(--color-border-light)] bg-slate-50'
              }`}
              onClick={() => document.getElementById('updater-file-input')?.click()}
            >
              <div className="text-7xl mb-6">📦</div>
              <p className="text-2xl font-black text-[var(--color-tertiary)] uppercase tracking-tight mb-2">Drop your files here</p>
              <p className="text-lg opacity-40 font-bold mb-8">Supports .package and .ts4script files</p>
              <button className="px-10 py-4 bg-[var(--color-tertiary)] text-white font-black uppercase tracking-[0.2em] rounded-full shadow-xl">
                 Choose Files
              </button>
              <input
                id="updater-file-input"
                type="file"
                accept=".package,.ts4script"
                multiple
                className="hidden"
                onChange={onFileInput}
              />
            </div>
          )}

          {/* ── STEP: Scanning ── */}
          {step === 'scanning' && (
            <div className="text-center py-20">
              <div className="text-xl font-black text-[var(--color-tertiary)] uppercase tracking-widest mb-6 animate-pulse">
                {progress.label}
              </div>
              <div className="w-full max-w-md mx-auto h-4 bg-slate-100 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-[var(--color-tertiary)] transition-all duration-300"
                   style={{ width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '10%' }}
                 />
              </div>
            </div>
          )}

          {/* ── STEP: Review ── */}
          {step === 'review' && (
            <div className="space-y-8">
              {/* Stats Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {[
                   { label: 'Resources', value: reports.length },
                   { label: 'Issues', value: totalIssues, warning: totalIssues > 0 },
                   { label: 'Fixes Ready', value: totalFixed },
                   { label: 'Clean', value: cleanReports.length }
                 ].map(s => (
                   <div key={s.label} className="p-6 bg-slate-50 rounded-[2rem] border-4 border-slate-100">
                      <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">{s.label}</div>
                      <div className={`text-3xl font-black ${s.warning ? 'text-red-500' : 'text-slate-800'}`}>{s.value}</div>
                   </div>
                 ))}
              </div>

              {totalIssues === 0 ? (
                <div className="p-12 bg-green-50 border-4 border-green-200 rounded-[3rem] text-center">
                  <div className="text-5xl mb-4">🏆</div>
                  <h3 className="text-2xl font-black text-green-800 uppercase tracking-tight">Your mods are up to date!</h3>
                  <p className="text-green-600 font-bold mt-2">Every resource passed schema validation.</p>
                </div>
              ) : (
                <div className="flex gap-8">
                  {/* Sidebar list */}
                  <div className="w-64 space-y-2 shrink-0">
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-40 px-4 mb-2">Affected Resources</div>
                    {issuedReports.map((r, i) => {
                      const idx = reports.indexOf(r);
                      const active = activeReport === idx;
                      return (
                        <button 
                          key={i}
                          onClick={() => setActiveReport(idx)}
                          className={`w-full text-left p-4 rounded-2xl border-4 transition-all ${
                            active ? 'border-[var(--color-tertiary)] bg-[var(--color-bg-primary)]' : 'border-transparent bg-white hover:bg-slate-50'
                          }`}
                        >
                           <div className="font-black text-sm uppercase truncate tracking-tight">{r.resource.tuningName || r.resource.className}</div>
                           <div className="text-[10px] opacity-40 font-bold uppercase">{r.issues.length} Issues</div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Main report area */}
                  {reports[activeReport] && (
                    <div className="flex-1 space-y-4">
                       <div className="p-6 bg-slate-50 rounded-[2rem] border-4 border-slate-100 flex items-center justify-between">
                          <div>
                             <div className="flex items-center gap-3">
                               <h4 className="font-black uppercase tracking-tight text-xl">{reports[activeReport].resource.tuningName}</h4>
                               {!reports[activeReport].schema && (
                                 <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[9px] font-black uppercase rounded-full tracking-widest border border-amber-200">
                                   Schema Missing
                                 </span>
                               )}
                             </div>
                             <p className="text-xs opacity-40 font-bold uppercase">{reports[activeReport].resource.className} {reports[activeReport].schema && `· ${reports[activeReport].schema.allValidNames.size} Valid Parameters`}</p>
                          </div>
                          {autoFixCount(reports[activeReport]) > 0 && (
                            <button 
                              onClick={() => approveAll(activeReport)}
                              className="px-6 py-2 bg-[var(--color-tertiary)] text-white rounded-full text-xs font-black uppercase tracking-widest"
                            >
                               Apply All Fixes
                            </button>
                          )}
                       </div>

                       <div className="space-y-3">
                          {reports[activeReport].issues.map((iss, i) => (
                            <div key={i} className={`p-6 rounded-[2rem] border-4 flex items-center justify-between gap-4 ${
                              reports[activeReport].approved.has(i) ? 'border-green-400 bg-green-50' : 'border-slate-200 bg-white'
                            }`}>
                               <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                     <span className="px-2 py-0.5 bg-slate-800 text-white text-[8px] font-black uppercase rounded-full tracking-widest">
                                        {iss.kind.replace('_', ' ')}
                                     </span>
                                     <code className="text-sm font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">{iss.fieldName}</code>
                                  </div>
                                  <p className="text-sm font-bold text-slate-600">{iss.message}</p>
                               </div>
                               {iss.autoFixable && (
                                 <button 
                                   onClick={() => toggleApproval(activeReport, i)}
                                   className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-4 transition-all ${
                                     reports[activeReport].approved.has(i) 
                                      ? 'bg-green-500 border-green-500 text-white' 
                                      : 'bg-white border-slate-800 text-slate-800'
                                   }`}
                                 >
                                    {reports[activeReport].approved.has(i) ? 'Applied' : 'Apply Fix'}
                                 </button>
                               )}
                            </div>
                          ))}
                       </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── STEP: Done ── */}
          {step === 'done' && (
            <div className="text-center py-20">
               <div className="text-9xl mb-8">🐝✨</div>
               <h2 className="text-5xl font-black text-[var(--color-tertiary)] uppercase tracking-tight mb-4">Patched Successfully!</h2>
               <p className="text-xl font-bold opacity-40 mb-10">Check your downloads folder for the updated .package files.</p>
               <button 
                 onClick={() => { setStep('drop'); setReports([]); fileBuffers.current.clear(); }}
                 className="px-12 py-5 bg-[var(--color-tertiary)] text-white rounded-full font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all"
               >
                 Update More
               </button>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {step === 'review' && (
           <div className="mt-8 pt-8 border-t-8 border-dashed border-slate-50 flex justify-end gap-4">
              <button 
                onClick={exportPatched}
                className="px-12 py-5 bg-[var(--color-tertiary)] text-white rounded-full font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all"
              >
                 Export Updated Package
              </button>
           </div>
        )}
      </div>
    </div>
  );
}

function autoFixCount(report: ResourceReport) {
  return report.issues.filter(i => i.autoFixable).length;
}
