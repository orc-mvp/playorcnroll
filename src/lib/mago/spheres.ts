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
  { key: 'library', labelPt: 'Biblioteca', labelEn: 'Library' },
  { key: 'chantry', labelPt: 'Capela', labelEn: 'Chantry' },
  { key: 'cover', labelPt: 'Cobertura', labelEn: 'Cover' },
  { key: 'familiar', labelPt: 'Companheiro Familiar', labelEn: 'Familiar' },
  { key: 'construct', labelPt: 'Constructo', labelEn: 'Construct' },
  { key: 'contacts', labelPt: 'Contatos', labelEn: 'Contacts' },
  { key: 'cult', labelPt: 'Culto', labelEn: 'Cult' },
  { key: 'destiny', labelPt: 'Destino', labelEn: 'Destiny' },
  { key: 'device', labelPt: 'Dispositivo', labelEn: 'Device' },
  { key: 'fame', labelPt: 'Fama', labelEn: 'Fame' },
  { key: 'genius', labelPt: 'Gênio', labelEn: 'Genius' },
  { key: 'hypercram', labelPt: 'Hiperestudo', labelEn: 'Hypercram' },
  { key: 'alternate_identity', labelPt: 'Identidade Alternativa', labelEn: 'Alternate Identity' },
  { key: 'influence', labelPt: 'Influência', labelEn: 'Influence' },
  { key: 'retainers', labelPt: 'Lacaios', labelEn: 'Retainers' },
  { key: 'legend', labelPt: 'Lenda', labelEn: 'Legend' },
  { key: 'wonder', labelPt: 'Maravilha', labelEn: 'Wonder' },
  { key: 'mentor', labelPt: 'Mentor', labelEn: 'Mentor' },
  { key: 'node', labelPt: 'Nodo', labelEn: 'Node' },
  { key: 'rank', labelPt: 'Patente', labelEn: 'Rank' },
  { key: 'sponsor', labelPt: 'Patrocínio', labelEn: 'Sponsorship' },
  { key: 'resources', labelPt: 'Recursos', labelEn: 'Resources' },
  { key: 'backup', labelPt: 'Reforços', labelEn: 'Backup' },
  { key: 'requisitions', labelPt: 'Requisição', labelEn: 'Requisitions' },
  { key: 'sanctum', labelPt: 'Santuário', labelEn: 'Sanctum' },
  { key: 'dream', labelPt: 'Sonho', labelEn: 'Dream' },
  { key: 'past_lives', labelPt: 'Vidas Passadas', labelEn: 'Past Lives' },
  { key: 'enhancement', labelPt: 'Aprimoramentos', labelEn: 'Enhancements' },
  { key: 'secret_weapons', labelPt: 'Armas Secretas', labelEn: 'Secret Weapons' },
  { key: 'laboratory', labelPt: 'Laboratório', labelEn: 'Laboratory' },
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
