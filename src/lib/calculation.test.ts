import { describe, expect, it } from 'vitest'

import {
  calculateImportPayments,
  calculationInputSchema,
  type CalculationInput,
} from '@/lib/calculation'

const makeInput = (): CalculationInput => ({
  calculationDate: '2026-10-08',
  currency: 'USD',
  exchangeRateToUzs: '12000',
  exchangeRateDate: '2026-10-08',
  clearanceFeeUzs: '',
  items: [
    {
      lineId: 'synthetic-1',
      hsCode: '0123456789',
      description: 'Синтетический тестовый товар',
      unit: 'шт',
      quantity: '2',
      customsValue: '1000',
      tariffType: 'ad-valorem',
      adValoremRate: '10',
      perUnitRate: '',
      combinationRule: '',
      rateSource: { kind: 'manual', label: 'Введено пользователем' },
    },
  ],
})

describe('calculation engine', () => {
  it('calculates an ad-valorem duty with decimal strings', () => {
    const result = calculateImportPayments(makeInput())
    const duty = result.items[0].payments[0]

    expect(result.items[0].customsValueUzs).toBe('12000000.00')
    expect(result.items[0].quantity).toBe('2')
    expect(result.items[0].unit).toBe('шт')
    expect(duty.amount).toBe('1200000.00')
    expect(duty.sourceKind).toBe('manual')
    expect(result.finalTotal).toBeNull()
  })

  it('keeps a real zero distinct from a missing rate', () => {
    const zeroInput = makeInput()
    zeroInput.items[0].adValoremRate = '0'
    const zeroDuty = calculateImportPayments(zeroInput).items[0].payments[0]

    const missingInput = makeInput()
    missingInput.items[0].tariffType = 'missing'
    missingInput.items[0].adValoremRate = ''
    const missingResult = calculateImportPayments(missingInput)
    const missingDuty = missingResult.items[0].payments[0]

    expect(zeroDuty.status).toBe('zero')
    expect(zeroDuty.amount).toBe('0.00')
    expect(missingDuty.status).toBe('missing-input')
    expect(missingDuty.amount).toBeNull()
    expect(missingResult.isComplete).toBe(false)
    expect(missingResult.finalTotal).toBeNull()
  })

  it('keeps manual and confirmed rate sources distinct', () => {
    const manualDuty = calculateImportPayments(makeInput()).items[0].payments[0]
    const confirmedInput = makeInput()
    confirmedInput.items[0].rateSource = {
      kind: 'confirmed',
      label: 'Синтетический подтверждённый источник',
    }
    const confirmedDuty =
      calculateImportPayments(confirmedInput).items[0].payments[0]

    expect(manualDuty.sourceKind).toBe('manual')
    expect(manualDuty.message).toContain('введена пользователем')
    expect(confirmedDuty.sourceKind).toBe('confirmed')
    expect(confirmedDuty.source).toBe('Синтетический подтверждённый источник')
    expect(confirmedDuty.message).toBeNull()
  })

  it('rounds money once with ROUND_HALF_UP', () => {
    const input = makeInput()
    input.exchangeRateToUzs = '1'
    input.items[0].customsValue = '10.05'
    input.items[0].adValoremRate = '10'

    const duty = calculateImportPayments(input).items[0].payments[0]

    expect(duty.amount).toBe('1.01')
  })

  it('supports a per-unit manual tariff', () => {
    const input = makeInput()
    input.exchangeRateToUzs = '2'
    input.items[0].quantity = '3'
    input.items[0].tariffType = 'per-unit'
    input.items[0].adValoremRate = ''
    input.items[0].perUnitRate = '4.5'

    const duty = calculateImportPayments(input).items[0].payments[0]

    expect(duty.amount).toBe('27.00')
  })

  it('adds a shipment fee once for multiple goods', () => {
    const input = makeInput()
    input.items.push({
      ...input.items[0],
      lineId: 'synthetic-2',
      hsCode: '1123456789',
    })
    input.clearanceFeeUzs = '50000'

    const result = calculateImportPayments(input)

    expect(result.shipmentPayments).toHaveLength(1)
    expect(result.knownSubtotal).toBe('2450000.00')
  })

  it('rejects invalid decimal input', () => {
    const input = makeInput()
    input.items[0].customsValue = '12x'

    expect(calculationInputSchema.safeParse(input).success).toBe(false)
  })

  it('rejects calendar dates that match the shape but do not exist', () => {
    const invalidCalculationDate = makeInput()
    invalidCalculationDate.calculationDate = '2026-02-30'
    const invalidRateDate = makeInput()
    invalidRateDate.exchangeRateDate = '2026-13-01'

    expect(
      calculationInputSchema.safeParse(invalidCalculationDate).success,
    ).toBe(false)
    expect(calculationInputSchema.safeParse(invalidRateDate).success).toBe(false)
  })

  it('does not guess MAX or SUM for a combined tariff', () => {
    const input = makeInput()
    input.items[0].tariffType = 'combined'
    input.items[0].perUnitRate = '3'
    input.items[0].combinationRule = ''

    const duty = calculateImportPayments(input).items[0].payments[0]

    expect(duty.status).toBe('unsupported')
    expect(duty.amount).toBeNull()
  })
})
