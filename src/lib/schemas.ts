import { ModEntityType, SchemaField, ElementSchema } from '../types';

export const ELEMENT_SCHEMAS: Partial<Record<ModEntityType, ElementSchema>> = {
  Trait: {
    type: 'Trait',
    label: 'Trait',
    icon: '/trait.png',
    category: 'Core',
    description: 'A personality characteristic that defines Sim behavior.',
    fields: [
      { id: 'display_name', label: 'Display Name', type: 'string', required: true, description: 'The name shown in the UI.' },
      { id: 'trait_description', label: 'Description', type: 'string', required: true, description: 'The tooltip description.' },
      { id: 'trait_origin_description', label: 'Origin Description', type: 'string', description: 'Additional origin text (e.g. from Career).' },
      { id: 'internal_name', label: 'Internal Name', type: 'string', description: 'Structure: Creator_Name_Trait.' },
      { id: 'trait_type', label: 'Trait Type', type: 'enum', options: [
        { value: 'PERSONALITY', label: 'Personality' },
        { value: 'GAMEPLAY', label: 'Gameplay' },
        { value: 'HIDDEN', label: 'Hidden' },
        { value: 'GHOST', label: 'Ghost' },
        { value: 'MENTAL', label: 'Mental (Child)' },
        { value: 'SOCIAL', label: 'Social (Child)' },
        { value: 'MOTOR', label: 'Motor (Child)' },
        { value: 'CREATIVE', label: 'Creative (Child)' }
      ], default: 'PERSONALITY' },
      { id: 'ages', label: 'Eligible Ages', type: 'multiEnum', options: [
        { value: 'INFANT', label: 'Infant' },
        { value: 'TODDLER', label: 'Toddler' },
        { value: 'CHILD', label: 'Child' },
        { value: 'TEEN', label: 'Teen' },
        { value: 'YOUNGADULT', label: 'Young Adult' },
        { value: 'ADULT', label: 'Adult' },
        { value: 'ELDER', label: 'Elder' }
      ]},
      { id: 'cas_category', label: 'CAS Category', type: 'enum', advanced: true, options: [
        { value: 'PRIMARY', label: 'Primary (Personality)' },
        { value: 'LIFESTYLE', label: 'Lifestyle' },
        { value: 'SOCIAL', label: 'Social' },
        { value: 'MENTAL', label: 'Mental' }
      ], default: 'PRIMARY' },
      { id: 'walkstyle', label: 'Walkstyle Override', type: 'string', advanced: true, description: 'S4S internal name for walkstyle.' },
      { id: 'icon', label: 'Trait Icon', type: 'resource', description: '128x128 image resource.' },
      { id: 'disable_aging', label: 'No Aging', type: 'boolean', description: 'Sims with this trait will not age.' },
      { id: 'voice_effect', label: 'Voice Effect', type: 'string', description: 'e.g. Ghost, Alien, Robot' },
      { id: 'permanent_buff', label: 'Permanent Hidden Buff', type: 'reference', targetType: 'Buff', description: 'Adds commodities or modifiers.' },
      { id: 'conflicting_traits', label: 'Conflicts With', type: 'list', targetType: 'Trait' },
      { id: 'whims', label: 'Whim Set', type: 'reference', targetType: 'CustomTuningElement', advanced: true },
      { id: 'tags', label: 'Search Tags', type: 'multiEnum', options: [
        { value: 'TraitPersonality', label: 'Personality' },
        { value: 'TraitLifestyle', label: 'Lifestyle' },
        { value: 'TraitSocial', label: 'Social' }
      ]}
    ]
  },
  Buff: {
    type: 'Buff',
    label: 'Buff',
    icon: '/buff.png',
    category: 'Core',
    description: 'A temporary status effect (moodlet) on a Sim. Can alter emotions, skills, and behavior.',
    fields: [
      { id: 'internal_name', label: 'Internal Name', type: 'string', description: 'Used by the game to identify this tuning. Example: MyMod:Buff_Happy' },
      { id: 'buff_name', label: 'Display Name', type: 'string', description: 'The name shown to the player in-game.' },
      { id: 'buff_description', label: 'Description', type: 'textarea', description: 'The flavor text shown when hovering over the moodlet.' },
      { id: 'buff_reason', label: 'Reason', type: 'string', description: 'Small text below the name, e.g., "(From drinking coffee)"' },
      { id: 'icon', label: 'Icon Key', type: 'string', description: 'The S4S icon resource key (Type:Group:Instance).' },
      { id: 'mood_type', label: 'Emotion', type: 'enum', options: [
        { value: 'Happy', label: 'Happy' },
        { value: 'Angry', label: 'Angry' },
        { value: 'Confident', label: 'Confident' },
        { value: 'Flirty', label: 'Flirty' },
        { value: 'Energized', label: 'Energized' },
        { value: 'Focused', label: 'Focused' },
        { value: 'Inspired', label: 'Inspired' },
        { value: 'Playful', label: 'Playful' },
        { value: 'Sad', label: 'Sad' },
        { value: 'Tense', label: 'Tense' },
        { value: 'Scared', label: 'Scared' },
        { value: 'Uncomfortable', label: 'Uncomfortable' },
        { value: 'Bored', label: 'Bored' },
        { value: 'Dazed', label: 'Dazed' },
        { value: 'Embarrassed', label: 'Embarrassed' }
      ] },
      { id: 'mood_weight', label: 'Emotion Weight', type: 'integer', default: 1 },
      { id: 'duration', label: 'Duration (Minutes)', type: 'integer', default: 0, description: 'Set to 0 for infinite duration. (Game minute unit)' },
      { id: 'visible', label: 'Visible in UI', type: 'boolean', default: true },
      { id: 'decay_modifiers', label: 'Decay Modifiers', type: 'string', advanced: true, description: 'Multiply decay of specific stats (Format: StatName:Mult, ... or raw XML list)' },
      { id: 'stat_asm_modifiers', label: 'Skill Gain Boosts', type: 'string', advanced: true, description: 'Boost skill learning rates.' },
      { id: 'whims', label: 'Whim Set', type: 'reference', targetType: 'CustomTuningElement', advanced: true }
    ]
  },
  XmlInjectorSnippet: {
    type: 'XmlInjectorSnippet',
    label: 'XML Injector Snippet',
    icon: '/gears.png',
    category: 'Systems',
    description: 'Injects interactions into objects/Sims without conflicts. Requires XML Injector.',
    fields: [
      { id: 'internal_name', label: 'Internal Name', type: 'string' },
      { id: 'injection_type', label: 'Injection Type', type: 'enum', options: [
        { value: 'object_affordance', label: 'Add to Object by ID' },
        { value: 'sim_affordance', label: 'Add to Sim (Friendly, etc.)' },
        { value: 'computer_affordance', label: 'Add to All Computers' },
        { value: 'phone_affordance', label: 'Add to Phone Menu' }
      ] },
      { id: 'affordance_ref', label: 'Interaction to Inject', type: 'reference', targetType: 'SocialInteraction' },
      { id: 'target_object_id', label: 'Target Object ID (Decimal)', type: 'string', description: 'Find these in S4S or a database (only required for Object by ID). e.g. 14845 for Mirror.' }
    ]
  },
  Commodity: {
    type: 'Commodity',
    label: 'Commodity',
    icon: '/gears.png',
    category: 'Systems',
    description: 'A value that decays or grows over time (e.g. Interval Timer).',
    fields: [
      { id: 'internal_name', label: 'Internal Name', type: 'string' },
      { id: 'min_value', label: 'Min Value', type: 'float', default: 0 },
      { id: 'max_value', label: 'Max Value', type: 'float', default: 10 },
      { id: 'initial_value', label: 'Initial Value', type: 'float', default: 10 },
      { id: 'decay_rate', label: 'Decay Rate', type: 'float', default: 1 },
      { id: 'at_zero_loot', label: 'Loot at Zero', type: 'reference', targetType: 'LootActionSet', description: 'Loot list fired when value hits 0.' }
    ]
  },
  LootActionSet: {
    type: 'LootActionSet',
    label: 'Loot Action Set',
    icon: '/gears.png',
    category: 'Systems',
    description: 'A collection of effects (Buffs, Stats, Traits).',
    fields: [
      { id: 'internal_name', label: 'Internal Name', type: 'string' },
      { id: 'variant', label: 'Loot Pattern', type: 'enum', options: [
        { value: 'buff', label: 'Apply Buff (buff_loot_op)' },
        { value: 'buff_removal', label: 'Remove Buff (buff_removal)' },
        { value: 'know_trait', label: 'Learn/Add Trait (trait_add)' },
        { value: 'know_other_sims_trait', label: 'Learn Other Sim Traits' },
        { value: 'remove_trait', label: 'Remove Trait (trait_remove)' },
        { value: 'stat_set_max', label: 'Reset Commodity (statistic_set_max)' },
        { value: 'money', label: 'Money Reward (money_loot)' },
        { value: 'statistic_change', label: 'Stat Change (statistic_change)' },
        { value: 'skill_level_change', label: 'Skill Level Change' },
        { value: 'relationship_bit', label: 'Relationship Bit Add' },
        { value: 'notification', label: 'Show Notification' }
      ]},
      { id: 'amount', label: 'Amount (Money/Stat)', type: 'integer', default: 0 },
      { id: 'buff_ref', label: 'Buff Target', type: 'reference', targetType: 'Buff' },
      { id: 'buff_subject', label: 'Buff Subject', type: 'enum', options: [
        { value: 'Actor', label: 'Actor (Self)' },
        { value: 'TargetSim', label: 'Target Sim' }
      ], default: 'Actor' },
      { id: 'trait_ref', label: 'Trait Target', type: 'reference', targetType: 'Trait' },
      { id: 'trait_refs', label: 'Potential Traits (Multiple)', type: 'list', targetType: 'Trait' },
      { id: 'stat_ref', label: 'Statistic/Commodity Target', type: 'reference', targetType: 'Commodity' },
      { id: 'rel_bit_ref', label: 'Relationship Bit Target', type: 'reference', targetType: 'RelBit' },
      { id: 'notification_title', label: 'Notification Title', type: 'string' },
      { id: 'notification_text', label: 'Notification Text', type: 'textarea' }
    ]
  },
  MixerInteraction: {
    type: 'MixerInteraction',
    label: 'Social Mixer',
    icon: '/speechbubble.png',
    category: 'Social',
    description: 'Scripted behavior for custom social interaction snippets.',
    fields: [
      { id: 'internal_name', label: 'Internal Name', type: 'string' },
      { id: 'display_name', label: 'Display Name', type: 'string' },
      { id: 'pie_menu_category', label: 'Pie Menu Groups', type: 'multiEnum', options: [
        { value: 'Friendly', label: 'Friendly' },
        { value: 'Mean', label: 'Mean' },
        { value: 'Flirty', label: 'Flirty' },
        { value: 'Funny', label: 'Funny' }
      ]},
      { id: 'loot_on_completion', label: 'Outcome Loot', type: 'reference', targetType: 'LootActionSet' },
      { id: 'category_tags', label: 'Social Categories', type: 'multiEnum', options: [
        { value: 'Interaction_Mixer', label: 'Mixer' },
        { value: 'Interaction_SocialMixer', label: 'Social Mixer' },
        { value: 'Interaction_Friendly', label: 'Friendly' },
        { value: 'Interaction_Mean', label: 'Mean' },
        { value: 'Interaction_Flirty', label: 'Flirty' },
        { value: 'Interaction_Funny', label: 'Funny' },
        { value: 'Interaction_Chat', label: 'Chat' }
      ]},
      { id: 'icon', label: 'Pie Menu Icon', type: 'resource' }
    ]
  },
  SocialInteraction: {
    type: 'SocialInteraction',
    label: 'Social Interaction',
    icon: '/speechbubble.png',
    category: 'Social',
    description: 'A scripted conversation or interaction between Sims.',
    fields: [
      { id: 'internal_name', label: 'Internal Name', type: 'string' },
      { id: 'display_name', label: 'Display Name', type: 'string' },
      { id: 'pie_menu_category', label: 'Pie Menu Groups', type: 'multiEnum', options: [
        { value: 'Friendly', label: 'Friendly' },
        { value: 'Mean', label: 'Mean' },
        { value: 'Flirty', label: 'Flirty' },
        { value: 'Funny', label: 'Funny' }
      ]},
      { id: 'icon', label: 'Pie Menu Icon', type: 'resource' },
      { id: 'loot_on_success', label: 'Loot on Success', type: 'reference', targetType: 'LootActionSet', advanced: true },
      { id: 'loot_on_failure', label: 'Loot on Failure', type: 'reference', targetType: 'LootActionSet', advanced: true },
      { id: 'success_weight', label: 'Base Success Weight', type: 'integer', default: 100, advanced: true },
      { id: 'animation_ref', label: 'Animation Clip', type: 'string', advanced: true, description: 'S4S internal animation name.' }
    ]
  },
  SuperInteraction: {
    type: 'SuperInteraction',
    label: 'Super Interaction',
    icon: '/simscrystal.png',
    category: 'Gameplay',
    description: 'A top-level interaction performed on an object or Sim.',
    fields: [
      { id: 'internal_name', label: 'Internal Name', type: 'string' },
      { id: 'display_name', label: 'Display Name', type: 'string' },
      { id: 'allow_autonomous', label: 'Allow Autonomous', type: 'boolean', default: true },
      { id: 'outcome_loot', label: 'Outcome Loot', type: 'reference', targetType: 'LootActionSet', advanced: true }
    ]
  },
  ActionTrigger: {
    type: 'ActionTrigger',
    label: 'Action Trigger',
    icon: '/gears.png',
    category: 'Systems',
    description: 'Triggers events based on specific conditions.',
    fields: [
      { id: 'internal_name', label: 'Internal Name', type: 'string' },
      { id: 'trigger_type', label: 'Trigger Type', type: 'enum', options: [
        { value: 'ON_BUFF_ADD', label: 'On Buff Added' },
        { value: 'ON_SIM_SPARED', label: 'On Sim Spared' },
        { value: 'ON_STAT_CHANGE', label: 'On Stat Changed' }
      ]},
      { id: 'trigger_target_ref', label: 'Target (Buff/Stat)', type: 'reference', targetType: 'Buff', advanced: true },
      { id: 'threshold', label: 'Stat Threshold', type: 'float', default: 0, advanced: true },
      { id: 'loot_list', label: 'Loot Action to Fire', type: 'reference', targetType: 'LootActionSet', advanced: true },
      { id: 'sim_filter', label: 'Sim Filter Scope', type: 'reference', targetType: 'SimFilter', advanced: true }
    ]
  },
  AspirationCategory: {
    type: 'AspirationCategory',
    label: 'Aspiration Category',
    icon: '/aspirationcat.png',
    category: 'Core',
    description: 'Grouping for different aspirations.',
    fields: [
      { id: 'display_name', label: 'Display Name', type: 'string', required: true },
      { id: 'icon', label: 'Category Icon', type: 'resource' }
    ]
  },
  AspirationTrack: {
    type: 'AspirationTrack',
    label: 'Aspiration Track',
    icon: '/aspirationtrack.png',
    category: 'Core',
    description: 'A specific path for an aspiration.',
    fields: [
      { id: 'display_name', label: 'Display Name', type: 'string', required: true },
      { id: 'description', label: 'Description', type: 'string' },
      { id: 'category', label: 'Category', type: 'reference', targetType: 'AspirationCategory' },
      { id: 'icon', label: 'Track Icon', type: 'resource' }
    ]
  },
  BalloonSet: {
    type: 'BalloonSet',
    label: 'Balloon Set',
    icon: '/speechbubble.png',
    category: 'Misc',
    description: 'Thought balloons shown during interactions.',
    fields: [
      { id: 'balloon_icon', label: 'Icon Asset', type: 'resource' }
    ]
  },
  Broadcaster: {
    type: 'Broadcaster',
    label: 'Broadcaster',
    icon: '/gears.png',
    category: 'Misc',
    description: 'Emits pulses that affect nearby Sims.',
    fields: [
      { id: 'radius', label: 'Pulse Radius', type: 'float', default: 5.0 },
      { id: 'frequency', label: 'Pulse Frequency (Seconds)', type: 'float', default: 1.0 },
      { id: 'effects', label: 'Loot Applied', type: 'reference', targetType: 'LootActionSet' }
    ]
  },
  Career: {
    type: 'Career',
    label: 'Career',
    icon: '/career.png',
    category: 'Core',
    description: 'Defines a Sims job and levels.',
    fields: [
      { id: 'career_name', label: 'Career Name', type: 'string', required: true },
      { id: 'career_description', label: 'Career Description', type: 'string' },
      { id: 'career_image', label: 'Career Image', type: 'resource' },
      { id: 'initial_salary', label: 'Entry Level Salary', type: 'integer', default: 20 }
    ]
  },
  Preference: {
    type: 'Preference',
    label: 'Preference',
    icon: '/preferences.png',
    category: 'Core',
    description: 'Likes and dislikes (Hobbies, Colors, etc.).',
    fields: [
      { id: 'display_name', label: 'Display Name', type: 'string', required: true },
      { id: 'preference_type', label: 'Type', type: 'enum', options: [
        { value: 'LIKE', label: 'Like' },
        { value: 'DISLIKE', label: 'Dislike' }
      ]}
    ]
  },
  PreferenceCategory: {
    type: 'PreferenceCategory',
    label: 'Preference Category',
    icon: '/preferences.png',
    category: 'Core',
    description: 'Category for preferences.',
    fields: [
      { id: 'display_name', label: 'Display Name', type: 'string', required: true }
    ]
  },
  ComplexWantAndFearSet: {
    type: 'ComplexWantAndFearSet',
    label: 'Complex Want/Fear Set',
    icon: '/brain.png',
    category: 'Gameplay',
    description: 'Sophisticated grouping of Wants and Fears.',
    fields: [
      { id: 'name', label: 'Internal Name', type: 'string' }
    ]
  },
  CompoundConditionElement: {
    type: 'CompoundConditionElement',
    label: 'Compound Condition',
    icon: '/gears.png',
    category: 'Systems',
    description: 'Complex logic grouping.',
    fields: []
  },
  CustomTuningElement: {
    type: 'CustomTuningElement',
    label: 'Custom Tuning',
    icon: '/gears.png',
    category: 'Misc',
    description: 'Raw XML tuning for advanced users.',
    fields: [
      { id: 'raw_xml', label: 'Raw XML Content', type: 'string' }
    ]
  },
  EnumExtension: {
    type: 'EnumExtension',
    label: 'Enum Extension',
    icon: '/gears.png',
    category: 'Misc',
    description: 'Extends existing game lists.',
    fields: [
      { id: 'enum_name', label: 'Enum to Extend', type: 'string' }
    ]
  },
  HolidayTradition: {
    type: 'HolidayTradition',
    label: 'Holiday Tradition',
    icon: '/gears.png',
    category: 'Gameplay',
    description: 'Custom activity for holidays.',
    fields: [
      { id: 'display_name', label: 'Tradition Name', type: 'string', required: true },
      { id: 'description', label: 'Description', type: 'string' },
      { id: 'icon', label: 'Icon', type: 'resource' }
    ]
  },
  LotTrait: {
    type: 'LotTrait',
    label: 'Lot Trait',
    icon: '/gears.png',
    category: 'Gameplay',
    description: 'A trait applied to a build/lot.',
    fields: [
      { id: 'display_name', label: 'Name', type: 'string', required: true },
      { id: 'description', label: 'Description', type: 'string' },
      { id: 'icon', label: 'Icon', type: 'resource' }
    ]
  },
  Milestone: {
    type: 'Milestone',
    label: 'Milestone',
    icon: '/milestone.png',
    category: 'Core',
    description: 'Significant life events.',
    fields: [
      { id: 'display_name', label: 'Milestone name', type: 'string', required: true },
      { id: 'milestone_description', label: 'Description', type: 'string' },
      { id: 'icon', label: 'Icon', type: 'resource' }
    ]
  },
  Objective: {
    type: 'Objective',
    label: 'Objective',
    icon: '/gears.png',
    category: 'Systems',
    description: 'A task for aspirations or events.',
    fields: [
      { id: 'objective_name', label: 'Objective Internal Name', type: 'string' },
      { id: 'resettable', label: 'Resettable', type: 'boolean', default: true }
    ]
  },
  ObjectiveSet: {
    type: 'ObjectiveSet',
    label: 'Objective Set',
    icon: '/gears.png',
    category: 'Systems',
    description: 'A collection of objectives.',
    fields: []
  },
  OddJob: {
    type: 'OddJob',
    label: 'Odd Job',
    icon: '/gears.png',
    category: 'Gameplay',
    description: 'One-off tasks for gig careers.',
    fields: [
      { id: 'display_name', label: 'Task Name', type: 'string' },
      { id: 'description', label: 'Task Description', type: 'string' }
    ]
  },
  PieMenuCategory: {
    type: 'PieMenuCategory',
    label: 'Pie Menu Category',
    icon: '/gears.png',
    category: 'Social',
    description: 'Folders in the interaction menu.',
    fields: [
      { id: 'display_name', label: 'Category Label', type: 'string', required: true },
      { id: 'parent_category', label: 'Parent Category', type: 'reference', targetType: 'PieMenuCategory' }
    ]
  },
  RelBit: {
    type: 'RelBit',
    label: 'Relationship Bit',
    icon: '/gears.png',
    category: 'Social',
    description: 'Defines a relationship status.',
    fields: [
      { id: 'display_name', label: 'Bit Name', type: 'string', required: true },
      { id: 'bit_description', label: 'Description', type: 'string' },
      { id: 'icon', label: 'Icon', type: 'resource' }
    ]
  },
  RewardSet: {
    type: 'RewardSet',
    label: 'Reward Set',
    icon: '/gears.png',
    category: 'Misc',
    description: 'Items awarded to a Sim.',
    fields: [
      { id: 'display_name', label: 'Reward Name', type: 'string' }
    ]
  },
  RoleState: {
    type: 'RoleState',
    label: 'Role State',
    icon: '/brain.png',
    category: 'Gameplay',
    description: 'Defines behavior in a situation.',
    fields: [
      { id: 'buffs_to_add', label: 'Buffs Applied', type: 'reference', targetType: 'Buff' }
    ]
  },
  SimFilter: {
    type: 'SimFilter',
    label: 'Sim Filter',
    icon: '/gears.png',
    category: 'Systems',
    description: 'Logic to choose specific Sims for an event.',
    fields: [
      { id: 'filter_name', label: 'Filter Label', type: 'string' },
      { id: 'age_restriction', label: 'Age Restriction', type: 'multiEnum', options: [
        { value: 'TODDLER', label: 'Toddler' },
        { value: 'CHILD', label: 'Child' },
        { value: 'TEEN', label: 'Teen' },
        { value: 'YOUNGADULT', label: 'Young Adult' },
        { value: 'ADULT', label: 'Adult' },
        { value: 'ELDER', label: 'Elder' }
      ]}
    ]
  },
  SimpleWantAndFearSet: {
    type: 'SimpleWantAndFearSet',
    label: 'Simple Want/Fear Set',
    icon: '/brain.png',
    category: 'Gameplay',
    description: 'Simple grouping for Wants/Fears.',
    fields: [
      { id: 'display_name', label: 'Set Name', type: 'string' }
    ]
  },
  SituationActivity: {
    type: 'SituationActivity',
    label: 'Situation Activity',
    icon: '/gears.png',
    category: 'Gameplay',
    description: 'Specific activities during an event.',
    fields: [
      { id: 'display_name', label: 'Activity Name', type: 'string' }
    ]
  },
  SituationSocialEvent: {
    type: 'SituationSocialEvent',
    label: 'Situation/Social Event',
    icon: '/gears.png',
    category: 'Gameplay',
    description: 'A full social event or situation.',
    fields: [
      { id: 'display_name', label: 'Event Name', type: 'string', required: true },
      { id: 'description', label: 'Description', type: 'string' },
      { id: 'icon', label: 'Event Icon', type: 'resource' },
      { id: 'max_participants', label: 'Max Participants', type: 'integer', default: 8 }
    ]
  },
  SituationGoal: {
    type: 'SituationGoal',
    label: 'Situation Goal',
    icon: '/milestone.png',
    category: 'Gameplay',
    description: 'A goal within a situation.',
    fields: [
      { id: 'display_name', label: 'Goal Name', type: 'string' },
      { id: 'score', label: 'Points Awarded', type: 'integer', default: 10 }
    ]
  },
  SituationJob: {
    type: 'SituationJob',
    label: 'Situation Job',
    icon: '/career.png',
    category: 'Gameplay',
    description: 'A specific role within a situation.',
    fields: [
      { id: 'display_name', label: 'Job Role Name', type: 'string' },
      { id: 'role_state', label: 'Role Behavior', type: 'reference', targetType: 'RoleState' }
    ]
  },
  Statistic: {
    type: 'Statistic',
    label: 'Statistic',
    icon: '/gears.png',
    category: 'Systems',
    description: 'A tracking value (e.g. Skill levels).',
    fields: [
      { id: 'display_name', label: 'Stat Name', type: 'string' },
      { id: 'min_value', label: 'Min Value', type: 'float', default: 0 },
      { id: 'max_value', label: 'Max Value', type: 'float', default: 100 }
    ]
  },
  WantFear: {
    type: 'WantFear',
    label: 'Want/Fear',
    icon: '/brain.png',
    category: 'Gameplay',
    description: 'A specific want or fear.',
    fields: [
      { id: 'display_name', label: 'Want/Fear Label', type: 'string', required: true },
      { id: 'description', label: 'Description', type: 'string' }
    ]
  },
  WantSetExtension: {
    type: 'WantSetExtension',
    label: 'Want Set Extension',
    icon: '/gears.png',
    category: 'Gameplay',
    description: 'Adds new wants to existing sets.',
    fields: [
      { id: 'target_set', label: 'Set to Extend', type: 'string' }
    ]
  },
  ZoneDirector: {
    type: 'ZoneDirector',
    label: 'Zone Director',
    icon: '/gears.png',
    category: 'Misc',
    description: 'Controls lot spawning logic (Experimental).',
    fields: [
      { id: 'name', label: 'Internal Name', type: 'string' }
    ]
  }
};
