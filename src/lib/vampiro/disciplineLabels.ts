// Helper to get discipline label from centralized i18n translations
// Uses the `disc_` prefix convention in the vampiro namespace

export const getDisciplineLabel = (key: string, lang: string, t?: any): string => {
  if (t?.vampiro) {
    const translationKey = `disc_${key}` as keyof typeof t.vampiro;
    const value = t.vampiro[translationKey];
    if (value && typeof value === 'string') return value;
  }
  // Fallback: return key capitalized
  return key.charAt(0).toUpperCase() + key.slice(1);
};
