/**
 * Catálogo único de traços do Storyteller System.
 *
 * Fonte única para Atributos e Habilidades usadas pelos sistemas WoD
 * (Vampiro, Lobisomem, Mago, Metamorfos). A criação/edição de personagem
 * usa este catálogo COMPLETO — qualquer sistema pode comprar qualquer
 * habilidade. Na sala de jogo, o que está em 0 é escondido para não inflar
 * a UI.
 *
 * Decisão de produto: melhor ter habilidade extra disponível do que faltar
 * algo e travar a criação. Filtragem fica no momento da exibição em jogo.
 */

export type Lang = 'pt-BR' | 'en-US';

export interface BilingualLabel {
  'pt-BR': string;
  'en-US': string;
}

export interface TraitItem {
  key: string;
  label: BilingualLabel;
}

export interface TraitGroup {
  label: BilingualLabel;
  items: TraitItem[];
}

// ============================================================
// ATRIBUTOS — idênticos nos quatro sistemas WoD
// ============================================================

export const STORYTELLER_ATTRIBUTES: Record<'physical' | 'social' | 'mental', TraitGroup> = {
  physical: {
    label: { 'pt-BR': 'Físicos', 'en-US': 'Physical' },
    items: [
      { key: 'strength', label: { 'pt-BR': 'Força', 'en-US': 'Strength' } },
      { key: 'dexterity', label: { 'pt-BR': 'Destreza', 'en-US': 'Dexterity' } },
      { key: 'stamina', label: { 'pt-BR': 'Vigor', 'en-US': 'Stamina' } },
    ],
  },
  social: {
    label: { 'pt-BR': 'Sociais', 'en-US': 'Social' },
    items: [
      { key: 'charisma', label: { 'pt-BR': 'Carisma', 'en-US': 'Charisma' } },
      { key: 'manipulation', label: { 'pt-BR': 'Manipulação', 'en-US': 'Manipulation' } },
      { key: 'appearance', label: { 'pt-BR': 'Aparência', 'en-US': 'Appearance' } },
    ],
  },
  mental: {
    label: { 'pt-BR': 'Mentais', 'en-US': 'Mental' },
    items: [
      { key: 'perception', label: { 'pt-BR': 'Percepção', 'en-US': 'Perception' } },
      { key: 'intelligence', label: { 'pt-BR': 'Inteligência', 'en-US': 'Intelligence' } },
      { key: 'wits', label: { 'pt-BR': 'Raciocínio', 'en-US': 'Wits' } },
    ],
  },
};

// ============================================================
// HABILIDADES — UNIÃO de todos os sistemas
// ============================================================
// Inclui habilidades exclusivas de cada sistema (Manha de Vampiro,
// Instinto Primitivo de Lobisomem, Enigmas/Rituais para Lobisomem/Mago,
// Finanças de Vampiro). Ordem alfabética em pt-BR dentro de cada grupo.

export const STORYTELLER_ABILITIES: Record<'talents' | 'skills' | 'knowledges', TraitGroup> = {
  talents: {
    label: { 'pt-BR': 'Talentos', 'en-US': 'Talents' },
    items: [
      { key: 'alertness', label: { 'pt-BR': 'Prontidão', 'en-US': 'Alertness' } },
      { key: 'athletics', label: { 'pt-BR': 'Esportes', 'en-US': 'Athletics' } },
      { key: 'brawl', label: { 'pt-BR': 'Briga', 'en-US': 'Brawl' } },
      { key: 'dodge', label: { 'pt-BR': 'Esquiva', 'en-US': 'Dodge' } },
      { key: 'empathy', label: { 'pt-BR': 'Empatia', 'en-US': 'Empathy' } },
      { key: 'expression', label: { 'pt-BR': 'Expressão', 'en-US': 'Expression' } },
      { key: 'intimidation', label: { 'pt-BR': 'Intimidação', 'en-US': 'Intimidation' } },
      { key: 'leadership', label: { 'pt-BR': 'Liderança', 'en-US': 'Leadership' } },
      // Vampiro
      { key: 'streetwise', label: { 'pt-BR': 'Manha', 'en-US': 'Streetwise' } },
      // Lobisomem
      { key: 'primalUrge', label: { 'pt-BR': 'Instinto Primitivo', 'en-US': 'Primal-Urge' } },
      { key: 'subterfuge', label: { 'pt-BR': 'Lábia', 'en-US': 'Subterfuge' } },
    ],
  },
  skills: {
    label: { 'pt-BR': 'Perícias', 'en-US': 'Skills' },
    items: [
      { key: 'animalKen', label: { 'pt-BR': 'Emp. c/Animais', 'en-US': 'Animal Ken' } },
      { key: 'crafts', label: { 'pt-BR': 'Ofícios', 'en-US': 'Crafts' } },
      { key: 'drive', label: { 'pt-BR': 'Condução', 'en-US': 'Drive' } },
      { key: 'etiquette', label: { 'pt-BR': 'Etiqueta', 'en-US': 'Etiquette' } },
      { key: 'firearms', label: { 'pt-BR': 'Armas de Fogo', 'en-US': 'Firearms' } },
      { key: 'melee', label: { 'pt-BR': 'Armas Brancas', 'en-US': 'Melee' } },
      { key: 'performance', label: { 'pt-BR': 'Performance', 'en-US': 'Performance' } },
      { key: 'security', label: { 'pt-BR': 'Segurança', 'en-US': 'Security' } },
      { key: 'stealth', label: { 'pt-BR': 'Furtividade', 'en-US': 'Stealth' } },
      { key: 'survival', label: { 'pt-BR': 'Sobrevivência', 'en-US': 'Survival' } },
    ],
  },
  knowledges: {
    label: { 'pt-BR': 'Conhecimentos', 'en-US': 'Knowledges' },
    items: [
      { key: 'academics', label: { 'pt-BR': 'Acadêmicos', 'en-US': 'Academics' } },
      { key: 'computer', label: { 'pt-BR': 'Computador', 'en-US': 'Computer' } },
      // Lobisomem / Mago
      { key: 'enigmas', label: { 'pt-BR': 'Enigmas', 'en-US': 'Enigmas' } },
      // Vampiro
      { key: 'finance', label: { 'pt-BR': 'Finanças', 'en-US': 'Finance' } },
      { key: 'investigation', label: { 'pt-BR': 'Investigação', 'en-US': 'Investigation' } },
      { key: 'law', label: { 'pt-BR': 'Direito', 'en-US': 'Law' } },
      { key: 'linguistics', label: { 'pt-BR': 'Linguística', 'en-US': 'Linguistics' } },
      { key: 'medicine', label: { 'pt-BR': 'Medicina', 'en-US': 'Medicine' } },
      { key: 'occult', label: { 'pt-BR': 'Ocultismo', 'en-US': 'Occult' } },
      { key: 'politics', label: { 'pt-BR': 'Política', 'en-US': 'Politics' } },
      // Lobisomem
      { key: 'rituals', label: { 'pt-BR': 'Rituais', 'en-US': 'Rituals' } },
      { key: 'science', label: { 'pt-BR': 'Ciências', 'en-US': 'Science' } },
    ],
  },
};

// ============================================================
// Helpers
// ============================================================

/** Retorna o label bilíngue de um traço (atributo ou habilidade). null se não existir. */
export function getTraitLabel(key: string, lang: Lang = 'pt-BR'): string {
  for (const group of Object.values(STORYTELLER_ATTRIBUTES)) {
    const item = group.items.find((i) => i.key === key);
    if (item) return item.label[lang];
  }
  for (const group of Object.values(STORYTELLER_ABILITIES)) {
    const item = group.items.find((i) => i.key === key);
    if (item) return item.label[lang];
  }
  return key;
}

/** Lista plana de chaves de atributos (9 itens). */
export const ALL_ATTRIBUTE_KEYS: string[] = [
  ...STORYTELLER_ATTRIBUTES.physical.items.map((i) => i.key),
  ...STORYTELLER_ATTRIBUTES.social.items.map((i) => i.key),
  ...STORYTELLER_ATTRIBUTES.mental.items.map((i) => i.key),
];

/** Lista plana de chaves de habilidades (união completa). */
export const ALL_ABILITY_KEYS: string[] = [
  ...STORYTELLER_ABILITIES.talents.items.map((i) => i.key),
  ...STORYTELLER_ABILITIES.skills.items.map((i) => i.key),
  ...STORYTELLER_ABILITIES.knowledges.items.map((i) => i.key),
];
