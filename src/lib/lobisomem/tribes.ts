// Werewolf: The Apocalypse - Tribes, Auspices, Breeds, Forms

export const TRIBES = [
  'Black Furies',
  'Bone Gnawers',
  'Children of Gaia',
  'Fianna',
  'Get of Fenris',
  'Glass Walkers',
  'Red Talons',
  'Shadow Lords',
  'Silent Striders',
  'Silver Fangs',
  'Stargazers',
  'Uktena',
  'Wendigo',
] as const;

export const AUSPICES = [
  'Ragabash',
  'Theurge',
  'Philodox',
  'Galliard',
  'Ahroun',
] as const;

export const BREEDS = [
  'Homid',
  'Metis',
  'Lupus',
] as const;

export const FORMS = [
  'hominid',
  'glabro',
  'crinos',
  'hispo',
  'lupus',
] as const;

export const RANKS = [
  'Cliath',
  'Fostern',
  'Adren',
  'Athro',
  'Elder',
] as const;

export type Tribe = typeof TRIBES[number];
export type Auspice = typeof AUSPICES[number];
export type Breed = typeof BREEDS[number];
export type Form = typeof FORMS[number];
export type Rank = typeof RANKS[number];
