const HTML_ENTITY_MAP = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

export function decodeHtmlEntities(value = '') {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    const normalized = entity.toLowerCase();

    if (normalized.startsWith('#')) {
      const isHex = normalized[1] === 'x';
      const rawCode = isHex ? normalized.slice(2) : normalized.slice(1);
      const codePoint = Number.parseInt(rawCode, isHex ? 16 : 10);

      return Number.isNaN(codePoint) ? match : String.fromCodePoint(codePoint);
    }

    return HTML_ENTITY_MAP[normalized] ?? match;
  });
}

export function getPlainTextPreview(value = '') {
  return decodeHtmlEntities(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
