export type GameSystemId = 'herois_marcados' | 'vampiro_v3';

export interface GameSystem {
  id: GameSystemId;
  name: string;
  shortName: string;
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
    description: {
      'pt-BR': 'Um RPG narrativo de fantasia medieval épica',
      'en': 'A narrative epic medieval fantasy RPG'
    },
    color: 'primary',
    available: true,
    features: ['Sistema 2d6', 'Extremos', 'Marcas', 'Movimentos Heroicos']
  },
  {
    id: 'vampiro_v3',
    name: 'Vampiro 3ª Edição',
    shortName: 'V3',
    description: {
      'pt-BR': 'Horror pessoal no Mundo das Trevas',
      'en': 'Personal horror in the World of Darkness'
    },
    color: 'red',
    available: false,
    features: ['Pool de d10', 'Fome', 'Humanidade', 'Disciplinas']
  }
];

export function getGameSystem(id: GameSystemId): GameSystem | undefined {
  return GAME_SYSTEMS.find(system => system.id === id);
}

export function getAvailableSystems(): GameSystem[] {
  return GAME_SYSTEMS.filter(system => system.available);
}
