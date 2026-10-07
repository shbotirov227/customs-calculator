import { describe, expect, it } from 'vitest'

import {
  loadProductCatalog,
  searchProductCatalog,
} from '@/lib/product-catalog'

describe('product catalog', () => {
  it('preserves source HS codes and does not invent rates', async () => {
    const catalog = await loadProductCatalog()
    const codes = catalog.map(({ code }) => code)

    expect(catalog).toHaveLength(13_138)
    expect(codes.every((code) => /^\d{10}$/u.test(code))).toBe(true)
    expect(codes.some((code) => code.startsWith('0'))).toBe(true)
    expect(new Set(codes).size).toBe(codes.length)
    expect(
      catalog.every(
        (item) =>
          Object.keys(item).sort().join(',') === 'code,description,unit',
      ),
    ).toBe(true)
  })

  it('searches by compact code prefix and limits the result', async () => {
    const catalog = await loadProductCatalog()
    const leadingZeroItem = catalog.find(({ code }) => code.startsWith('0'))

    expect(leadingZeroItem).toBeDefined()

    const results = await searchProductCatalog(
      leadingZeroItem!.code.slice(0, 4),
      3,
    )

    expect(results).toHaveLength(3)
    expect(results.every(({ code }) => code.startsWith('0'))).toBe(true)
    expect(
      results.every(
        (item) =>
          Object.keys(item).sort().join(',') === 'code,description,unit',
      ),
    ).toBe(true)
  })

  it('uses the reusable description index', async () => {
    const catalog = await loadProductCatalog()
    const wordCounts = new Map<string, number>()

    for (const { description } of catalog) {
      const words = new Set(
        description
          .toLocaleLowerCase('ru')
          .match(/[\p{L}\p{N}]{6,}/gu) ?? [],
      )

      for (const word of words) {
        wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1)
      }
    }

    const uniqueWord = [...wordCounts].find(([, count]) => count === 1)?.[0]
    expect(uniqueWord).toBeDefined()

    const results = await searchProductCatalog(uniqueWord!, 10)

    expect(results).toHaveLength(1)
    expect(results[0].description.toLocaleLowerCase('ru')).toContain(uniqueWord)
  })
})
