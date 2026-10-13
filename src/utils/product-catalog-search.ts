export const normalizeProductDescription = (value: string) =>
  value
    .toLocaleLowerCase("ru")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

export const getSearchBigrams = (value: string) => {
  const bigrams = new Set<string>();

  for (let index = 0; index < value.length - 1; index += 1) {
    bigrams.add(value.slice(index, index + 2));
  }

  return bigrams;
};

export const clampCatalogSearchLimit = (limit: number, maximum: number) =>
  Math.min(Math.max(Math.trunc(limit), 1), maximum);
