/**
 * Mago: A Ascensão (M20) — As 9 Esferas da Magia
 * Algumas Tradições/Convenções usam nomes alternativos (mostrados após "/").
 */
export interface SphereDef {
  key: string;
  labelPt: string;
  labelEn: string;
}

export const MAGO_SPHERES: SphereDef[] = [
  { key: 'correspondence', labelPt: 'Correspondência / Dados', labelEn: 'Correspondence / Data' },
  { key: 'entropy', labelPt: 'Entropia', labelEn: 'Entropy' },
  { key: 'forces', labelPt: 'Forças', labelEn: 'Forces' },
  { key: 'life', labelPt: 'Vida / Biociência', labelEn: 'Life / Bioscience' },
  { key: 'matter', labelPt: 'Matéria', labelEn: 'Matter' },
  { key: 'mind', labelPt: 'Mente', labelEn: 'Mind' },
  { key: 'prime', labelPt: 'Primórdio', labelEn: 'Prime' },
  { key: 'spirit', labelPt: 'Espírito / Ciência Dimensional', labelEn: 'Spirit / Dimensional Science' },
  { key: 'time', labelPt: 'Tempo', labelEn: 'Time' },
];

export const MAGO_BACKGROUNDS = [
  { key: 'allies', labelPt: 'Aliados', labelEn: 'Allies' },
  { key: 'arcane', labelPt: 'Arcano', labelEn: 'Arcane' },
  { key: 'avatar', labelPt: 'Avatar', labelEn: 'Avatar' },
  { key: 'backup', labelPt: 'Reforços', labelEn: 'Backup' },
  { key: 'chantry', labelPt: 'Capela', labelEn: 'Chantry' },
  { key: 'contacts', labelPt: 'Contatos', labelEn: 'Contacts' },
  { key: 'destiny', labelPt: 'Destino', labelEn: 'Destiny' },
  { key: 'dream', labelPt: 'Sonho', labelEn: 'Dream' },
  { key: 'enhancement', labelPt: 'Aprimoramento', labelEn: 'Enhancement' },
  { key: 'familiar', labelPt: 'Familiar', labelEn: 'Familiar' },
  { key: 'influence', labelPt: 'Influência', labelEn: 'Influence' },
  { key: 'library', labelPt: 'Biblioteca', labelEn: 'Library' },
  { key: 'mentor', labelPt: 'Mentor', labelEn: 'Mentor' },
  { key: 'node', labelPt: 'Nódulo', labelEn: 'Node' },
  { key: 'past_lives', labelPt: 'Vidas Passadas', labelEn: 'Past Lives' },
  { key: 'requisitions', labelPt: 'Requisições', labelEn: 'Requisitions' },
  { key: 'resources', labelPt: 'Recursos', labelEn: 'Resources' },
  { key: 'retainers', labelPt: 'Lacaios', labelEn: 'Retainers' },
  { key: 'sanctum', labelPt: 'Santuário', labelEn: 'Sanctum' },
  { key: 'secret_weapons', labelPt: 'Armas Secretas', labelEn: 'Secret Weapons' },
  { key: 'spies', labelPt: 'Espiões', labelEn: 'Spies' },
  { key: 'status', labelPt: 'Status', labelEn: 'Status' },
  { key: 'totem', labelPt: 'Totem', labelEn: 'Totem' },
  { key: 'wonder', labelPt: 'Maravilha', labelEn: 'Wonder' },
];

/** Tradições e Convenções (faccoes) — apenas para informações básicas do personagem */
export const MAGO_TRADITIONS = [
  // Tradições
  'Adeptos da Virtualidade',
  'Coro Celestial',
  'Culto do Êxtase',
  'Eutanatos',
  'Filhos do Éter',
  'Irmandade de Akasha',
  'Oradores dos Sonhos',
  'Ordem de Hermes',
  'Verbena',
  // Convenções da Tecnocracia
  'Engenheiros do Vácuo',
  'Iteração X',
  'Nova Ordem Mundial',
  'Progenitores',
  'Sindicato',
];

export interface MagoCharacterData {
  player?: string;
  chronicle?: string;
  nature?: string;
  demeanor?: string;
  tradition?: string;
  essence?: string;
  cabal?: string;
  attributes: {
    physical: { strength: number; dexterity: number; stamina: number };
    social: { charisma: number; manipulation: number; appearance: number };
    mental: { perception: number; intelligence: number; wits: number };
  };
  abilities: {
    talents: Record<string, number>;
    skills: Record<string, number>;
    knowledges: Record<string, number>;
  };
  specializations: Record<string, string>;
  spheres: Record<string, number>;
  rotes: Record<number, string[]>;
  backgrounds: Record<string, number>;
  arete: number;
  willpower: number;
  quintessence: number;
  paradox: number;
  merits_flaws: { id: string; name: string; cost: number; category: string }[];
}
