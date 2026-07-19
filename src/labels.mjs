/** Return true when a GitHub label belongs to the release namespace. */
export function isReleaseLabel(label) {
  return typeof label === 'string' && /^release:/i.test(label.trim());
}

/**
 * Normalize a human-entered GitHub label into a stable, comparable form.
 *
 * Trims surrounding whitespace, lowercases ASCII letters, collapses runs of
 * whitespace or underscores into a single hyphen, drops characters that are
 * not lowercase ASCII letters, digits, or hyphens, and finally collapses
 * repeated hyphens and trims hyphens from the ends. Returns an empty string
 * when no valid characters remain.
 *
 * @param {unknown} label - The candidate label value.
 * @returns {string} The normalized label.
 * @throws {TypeError} When `label` is not a string.
 */
export function normalizeLabel(label) {
  if (typeof label !== 'string') {
    throw new TypeError('label must be a string');
  }

  const lowercased = label.replace(/[A-Z]/g, (character) => character.toLowerCase());
  const trimmed = lowercased.trim();
  const separated = trimmed.replace(/[\s_]+/g, '-');
  const cleaned = separated.replace(/[^a-z0-9-]/g, '');

  return cleaned
    .replace(/-{2,}/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}
