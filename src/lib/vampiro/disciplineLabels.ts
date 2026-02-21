// Shared discipline labels for i18n across vampire session components
export const DISCIPLINE_LABELS: Record<string, { pt: string; en: string }> = {
  animalism: { pt: 'Animalismo', en: 'Animalism' },
  auspex: { pt: 'Auspícios', en: 'Auspex' },
  celerity: { pt: 'Celeridade', en: 'Celerity' },
  chimerstry: { pt: 'Quimerismo', en: 'Chimerstry' },
  dementation: { pt: 'Demência', en: 'Dementation' },
  dominate: { pt: 'Dominação', en: 'Dominate' },
  fortitude: { pt: 'Fortitude', en: 'Fortitude' },
  necromancy: { pt: 'Necromancia', en: 'Necromancy' },
  obfuscate: { pt: 'Ofuscação', en: 'Obfuscate' },
  obtenebration: { pt: 'Obtenebração', en: 'Obtenebration' },
  potence: { pt: 'Potência', en: 'Potence' },
  presence: { pt: 'Presença', en: 'Presence' },
  protean: { pt: 'Metamorfose', en: 'Protean' },
  quietus: { pt: 'Quietus', en: 'Quietus' },
  serpentis: { pt: 'Serpentis', en: 'Serpentis' },
  thaumaturgy: { pt: 'Taumaturgia', en: 'Thaumaturgy' },
  vicissitude: { pt: 'Vicissitude', en: 'Vicissitude' },
  daimonion: { pt: 'Daimonion', en: 'Daimonion' },
  melpominee: { pt: 'Melpominee', en: 'Melpominee' },
  mytherceria: { pt: 'Mytherceria', en: 'Mytherceria' },
  obeah: { pt: 'Obeah', en: 'Obeah' },
  sanguinus: { pt: 'Sanguinus', en: 'Sanguinus' },
  spiritus: { pt: 'Spiritus', en: 'Spiritus' },
  temporis: { pt: 'Temporis', en: 'Temporis' },
  thanatosis: { pt: 'Thanatosis', en: 'Thanatosis' },
  valeren: { pt: 'Valeren', en: 'Valeren' },
  visceratika: { pt: 'Visceratika', en: 'Visceratika' },
  flight: { pt: 'Voo', en: 'Flight' },
  bardo: { pt: 'Bardo', en: 'Bardo' },
  abombwe: { pt: 'Abombwe', en: 'Abombwe' },
};

export const getDisciplineLabel = (key: string, lang: string): string => {
  const label = DISCIPLINE_LABELS[key];
  return label ? (lang === 'pt-BR' ? label.pt : label.en) : key;
};
