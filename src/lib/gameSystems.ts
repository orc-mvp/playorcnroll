export type GameSystemId = 'herois_marcados' | 'vampiro_v3' | 'lobisomem_w20' | 'mago_m20' | 'metamorfos_w20';

/**
 * "Família" do sistema — usada para agrupar sistemas que rodam na mesma sala
 * de jogo. Família `storyteller` cobre Vampiro/Lobisomem/Mago/Metamorfos,
 * todos rodando na sala unificada `/session/storyteller/:id`.
 */
export type GameSystemFamily = 'storyteller' | 'herois_marcados';

export interface GameSystem {
  id: GameSystemId;
  name: string;
  shortName: string;
  family: GameSystemFamily;
  description: {
    'pt-BR': string;
    'en': string;
  };
  color: string;
  available: boolean;
  features: string[];
}

export const GAME_SYSTEMS: GameSystem[] = [
  {
    id: 'herois_marcados',
    name: 'Heróis Marcados',
    shortName: 'PBTA',
    family: 'herois_marcados',
    description: {
      'pt-BR': 'Um RPG narrativista de fantasia medieval épica.',
      'en': 'A narrativist epic medieval fantasy RPG.'
    },
    color: 'primary',
    available: true,
    features: ['Sistema 2d6', 'Extremos', 'Marcas', 'Movimentos Heroicos']
  },
  {
    id: 'vampiro_v3',
    name: 'Vampiro 3ª Edição',
    shortName: 'Storyteller',
    family: 'storyteller',
    description: {
      'pt-BR': 'Horror pessoal no Mundo das Trevas. Sala Storyteller — aceita também personagens de Lobisomem.',
      'en': 'Personal horror in the World of Darkness. Storyteller room — also accepts Werewolf characters.'
    },
    color: 'red',
    available: true,
    features: ['Pool de d10', 'Sangue', 'Humanidade', 'Disciplinas']
  },
  {
    id: 'lobisomem_w20',
    name: 'Lobisomem: O Apocalipse',
    shortName: 'Storyteller',
    family: 'storyteller',
    description: {
      'pt-BR': 'Fúria e honra na luta contra a Wyrm. Sala Storyteller — aceita também personagens de Vampiro.',
      'en': 'Rage and honor in the fight against the Wyrm. Storyteller room — also accepts Vampire characters.'
    },
    color: 'emerald',
    available: true,
    features: ['Pool de d10', 'Fúria', 'Gnose', 'Dons']
  },
  {
    id: 'mago_m20',
    name: 'Mago: A Ascensão',
    shortName: 'Storyteller',
    family: 'storyteller',
    description: {
      'pt-BR': 'Realidade moldada pela Vontade. Sala Storyteller — aceita também outros personagens do Mundo das Trevas.',
      'en': 'Reality shaped by Will. Storyteller room — also accepts other World of Darkness characters.'
    },
    color: 'purple',
    available: true,
    features: ['Pool de d10', 'Esferas', 'Arête', 'Quintessência']
  },
  {
    id: 'metamorfos_w20',
    name: 'Metamorfos',
    shortName: 'Storyteller',
    family: 'storyteller',
    description: {
      'pt-BR': 'Ferozes mudadores além dos lobos. Sala Storyteller — formas de guerra customizáveis.',
      'en': 'Fierce shifters beyond the wolves. Storyteller room — customizable war forms.'
    },
    color: 'amber',
    available: true,
    features: ['Pool de d10', 'Fúria', 'Gnose', 'Formas Customizáveis']
  }
];

export function getGameSystem(id: GameSystemId): GameSystem | undefined {
  return GAME_SYSTEMS.find(system => system.id === id);
}

export function getAvailableSystems(): GameSystem[] {
  return GAME_SYSTEMS.filter(system => system.available);
}
