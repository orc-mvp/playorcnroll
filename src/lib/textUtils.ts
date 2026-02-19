/**
 * Converts a string to title case (first letter of each word capitalized, rest lowercase).
 * Prevents all-caps words from being displayed.
 */
export function toTitleCase(text: string): string {
  if (!text) return text;
  return text
    .split(' ')
    .map((word) => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}
