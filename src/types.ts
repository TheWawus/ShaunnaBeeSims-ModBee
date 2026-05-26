export type ModEntityType = 
  | 'ActionTrigger' | 'AspirationCategory' | 'AspirationTrack' | 'BalloonSet' 
  | 'Broadcaster' | 'Buff' | 'Career' | 'Preference' | 'PreferenceCategory' 
  | 'Commodity' | 'ComplexWantAndFearSet' | 'CompoundConditionElement' 
  | 'CustomTuningElement' | 'EnumExtension' | 'HolidayTradition' 
  | 'LootActionSet' | 'LotTrait' | 'Milestone' | 'MixerInteraction' 
  | 'Objective' | 'ObjectiveSet' | 'OddJob' | 'PieMenuCategory' 
  | 'RelBit' | 'RewardSet' | 'RoleState' | 'SimFilter' 
  | 'SimpleWantAndFearSet' | 'SituationActivity' | 'SituationSocialEvent' 
  | 'SituationGoal' | 'SituationGoalSet' | 'SituationJob' | 'Situation' | 'SocialInteraction' | 'Statistic' 
  | 'SuperInteraction' | 'Trait' | 'WantFear' | 'WantSetExtension' 
  | 'XmlInjectorSnippet' | 'ZoneDirector' | 'GenericElement';

export interface ModProjectInfo {
  author: string;
  modName: string;
  displayName: string;
  version: string;
  description: string;
  gameVersion: string;
}

export interface ModElement {
  id: string; // Unique within project
  type: ModEntityType;
  data: Record<string, any>;
}

// Aliases for compatibility
export type TraitDefinition = ModElement;
export type BuffDefinition = ModElement;

export interface ModProjectState {
  projectVersion: string;
  modInfo: ModProjectInfo;
  elements: ModElement[];
  activeElementId?: string;
  scriptContent?: string;
  links?: { source: string; target: string; type: string }[];
}

// Schema Types
export interface FieldOption {
  value: string;
  label: string;
}

export type FieldType = 
  | 'string' | 'integer' | 'float' | 'boolean' | 'textarea'
  | 'enum' | 'multiEnum' | 'resource' | 'list' | 'loot' | 'reference' | 'color';

export interface SchemaField {
  id: string;
  label: string;
  type: FieldType;
  description?: string;
  placeholder?: string;
  required?: boolean;
  advanced?: boolean;
  options?: { value: string; label: string; description?: string }[];
  default?: any;
  targetType?: ModEntityType; // For 'reference' types
}

export interface ElementSchema {
  type: ModEntityType;
  label: string;
  icon: string;
  category: 'Core' | 'Gameplay' | 'Social' | 'Systems' | 'Misc';
  description: string;
  fields: SchemaField[];
}

export interface DBPFResource {
  typeId: number;
  groupId: number;
  instanceId: bigint;
  data: Uint8Array;
}

export interface STBLEntry {
  key: number;
  value: string;
}
