import { ModProjectState } from '../types';

export const EXAMPLE_PROJECT: ModProjectState = {
  projectVersion: '1.0',
  modInfo: {
    author: 'ShaunnaBeeSims',
    modName: 'HoodRatTrait',
    displayName: 'Hood Rat Trait',
    version: '3.1.1',
    description: 'A charismatic trait with custom social interactions.',
    gameVersion: '1.106'
  },
  elements: [
    {
      id: 'trait_hoodrat',
      type: 'Trait',
      data: {
        display_name: 'Hood Rat',
        trait_description: 'This Sim is street-smart and charismatic.',
        trait_type: 'PERSONALITY',
        ages: ['TEEN', 'YOUNGADULT', 'ADULT', 'ELDER']
      }
    },
    {
      id: 'buff_happy_hood',
      type: 'Buff',
      data: {
        buff_name: 'Feeling the Hood',
        mood_type: '14743011960414179192',
        mood_weight: 2
      }
    },
    {
      id: 'mixer_shout_out',
      type: 'MixerInteraction',
      data: {
        display_name: 'Give Shout Out',
        category: 'Friendly'
      }
    }
  ]
};
