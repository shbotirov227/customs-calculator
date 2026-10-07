import { queryOptions } from '@tanstack/react-query'

export interface ProductCatalogItem {
  code: string
  description: string
  unit: string | null
}

interface CatalogIndex {
  entries: readonly ProductCatalogItem[]
  normalizedDescriptions: readonly string[]
  descriptionBigrams: ReadonlyMap<string, readonly number[]>
}

const DEFAULT_RESULT_LIMIT = 20
const MAX_RESULT_LIMIT = 50
const MIN_QUERY_LENGTH = 2

let catalogPromise: Promise<readonly ProductCatalogItem[]> | undefined
let indexPromise: Promise<CatalogIndex> | undefined

const normalizeDescription = (value: string) =>
  value
    .toLocaleLowerCase('ru')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()

const getBigrams = (value: string) => {
  const bigrams = new Set<string>()

  for (let index = 0; index < value.length - 1; index += 1) {
    bigrams.add(value.slice(index, index + 2))
  }

  return bigrams
}

const buildCatalogIndex = (entries: readonly ProductCatalogItem[]) => {
  const normalizedDescriptions = entries.map((entry) =>
    normalizeDescription(entry.description),
  )
  const descriptionBigrams = new Map<string, number[]>()

  normalizedDescriptions.forEach((description, entryIndex) => {
    for (const bigram of getBigrams(description)) {
      const matches = descriptionBigrams.get(bigram)

      if (matches) {
        matches.push(entryIndex)
      } else {
        descriptionBigrams.set(bigram, [entryIndex])
      }
    }
  })

  return { entries, normalizedDescriptions, descriptionBigrams }
}

const getCatalogIndex = () => {
  indexPromise ??= loadProductCatalog().then(buildCatalogIndex)
  return indexPromise
}

const findCodeStartIndex = (
  entries: readonly ProductCatalogItem[],
  prefix: string,
) => {
  let lower = 0
  let upper = entries.length

  while (lower < upper) {
    const middle = Math.floor((lower + upper) / 2)

    if (entries[middle].code < prefix) {
      lower = middle + 1
    } else {
      upper = middle
    }
  }

  return lower
}

const clampLimit = (limit: number) =>
  Math.min(Math.max(Math.trunc(limit), 1), MAX_RESULT_LIMIT)

export const loadProductCatalog = async () => {
  catalogPromise ??= import('@/data/product-catalog.json').then(
    ({ default: entries }) => entries as readonly ProductCatalogItem[],
  )

  return catalogPromise
}

export const searchProductCatalog = async (
  query: string,
  limit = DEFAULT_RESULT_LIMIT,
) => {
  const normalizedDescriptionQuery = normalizeDescription(query)
  const compactQuery = query.replace(/\s+/gu, '')

  if (
    Math.max(normalizedDescriptionQuery.length, compactQuery.length) <
    MIN_QUERY_LENGTH
  ) {
    return []
  }

  const { entries, normalizedDescriptions, descriptionBigrams } =
    await getCatalogIndex()
  const resultLimit = clampLimit(limit)
  const results: ProductCatalogItem[] = []
  const resultCodes = new Set<string>()

  if (/^\d+$/u.test(compactQuery)) {
    const startIndex = findCodeStartIndex(entries, compactQuery)

    for (let index = startIndex; index < entries.length; index += 1) {
      const entry = entries[index]

      if (!entry.code.startsWith(compactQuery)) {
        break
      }

      results.push(entry)
      resultCodes.add(entry.code)

      if (results.length === resultLimit) {
        return results
      }
    }
  }

  if (normalizedDescriptionQuery.length >= MIN_QUERY_LENGTH) {
    const queryBigrams = getBigrams(normalizedDescriptionQuery)
    const candidateLists = [...queryBigrams]
      .map((bigram) => descriptionBigrams.get(bigram))
      .filter((matches): matches is readonly number[] => matches !== undefined)
      .sort((left, right) => left.length - right.length)

    if (candidateLists.length === queryBigrams.size) {
      for (const entryIndex of candidateLists[0] ?? []) {
        const entry = entries[entryIndex]

        if (
          !resultCodes.has(entry.code) &&
          normalizedDescriptions[entryIndex].includes(
            normalizedDescriptionQuery,
          )
        ) {
          results.push(entry)
          resultCodes.add(entry.code)

          if (results.length === resultLimit) {
            break
          }
        }
      }
    }
  }

  return results
}

export const productCatalogSearchQueryOptions = (
  query: string,
  limit = DEFAULT_RESULT_LIMIT,
) => {
  const normalizedQuery = query.trim()
  const normalizedLimit = clampLimit(limit)

  return queryOptions({
    queryKey: ['product-catalog', 'search', normalizedQuery, normalizedLimit],
    queryFn: () => searchProductCatalog(normalizedQuery, normalizedLimit),
    enabled: normalizedQuery.replace(/\s+/gu, '').length >= MIN_QUERY_LENGTH,
    staleTime: Number.POSITIVE_INFINITY,
  })
}
