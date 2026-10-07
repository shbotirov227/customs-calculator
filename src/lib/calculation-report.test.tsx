// @vitest-environment node
/// <reference types="node" />

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import { renderToBuffer } from '@react-pdf/renderer'
import { describe, expect, it } from 'vitest'

import type {
  CalculationResult,
  ItemCalculationResult,
  PaymentResult,
} from '@/lib/calculation'
import {
  createCalculationReportBlob,
  createCalculationReportDocument,
} from '@/lib/calculation-report'

type CompleteSyntheticResult = CalculationResult & {
  isComplete: true
  finalTotal: string
}

const calculatedDuty: PaymentResult = {
  type: 'customs-duty',
  label: 'Ввозная таможенная пошлина',
  base: '1200000.00',
  baseLabel: 'Таможенная стоимость, UZS',
  rate: '10',
  rateLabel: '10%',
  amount: '120000.00',
  source: 'Синтетический подтверждённый источник',
  sourceKind: 'confirmed',
  status: 'calculated',
  message: null,
}

const notApplicablePayment = (
  type: Extract<PaymentResult['type'], 'vat' | 'excise' | 'additional-duty'>,
  label: string,
): PaymentResult => ({
  type,
  label,
  base: null,
  baseLabel: 'Не применяется в синтетическом snapshot',
  rate: null,
  rateLabel: 'Ставка отсутствует',
  amount: null,
  source: 'Синтетический подтверждённый источник',
  sourceKind: 'confirmed',
  status: 'not-applicable',
  message: null,
})

const makeItem = (index: number): ItemCalculationResult => ({
  lineId: `synthetic-${index}`,
  hsCode: `${index}`.padStart(10, '0'),
  description: `Синтетический товар ${index}. Данные не относятся к реальной декларации.`,
  quantity: '2',
  unit: 'шт',
  customsValueUzs: '1200000.00',
  payments: [
    calculatedDuty,
    notApplicablePayment('vat', 'НДС'),
    notApplicablePayment('excise', 'Акциз'),
    notApplicablePayment('additional-duty', 'Дополнительная пошлина'),
  ],
  knownSubtotal: '120000.00',
})

const makeSnapshot = (itemCount: number): CompleteSyntheticResult => ({
  calculationDate: '2026-10-08',
  exchangeRateDate: '2026-10-08',
  inputCurrency: 'USD',
  outputCurrency: 'UZS',
  exchangeRateToUzs: '12000',
  items: Array.from({ length: itemCount }, (_, index) => makeItem(index + 1)),
  shipmentPayments: [
    {
      type: 'clearance-fee',
      label: 'Сбор за таможенное оформление',
      base: '1',
      baseLabel: 'Одна отправка',
      rate: '50000.00',
      rateLabel: 'Фиксированная сумма, UZS',
      amount: '50000.00',
      source: 'Синтетический подтверждённый источник',
      sourceKind: 'confirmed',
      status: 'calculated',
      message: 'Применяется один раз к отправке.',
    },
  ],
  knownSubtotal: `${itemCount * 120000 + 50000}.00`,
  finalTotal: `${itemCount * 120000 + 50000}.00`,
  isComplete: true,
})

const toBytes = (buffer: Buffer) => new Uint8Array(buffer)

describe('calculation PDF report', () => {
  it('renders a one-product final report from a supplied result snapshot', async () => {
    const buffer = await renderToBuffer(
      createCalculationReportDocument(makeSnapshot(1)),
    )

    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-')
    expect(buffer.byteLength).toBeGreaterThan(10_000)
  })

  it('blocks PDF generation for an incomplete result', () => {
    const incompleteResult: CalculationResult = {
      ...makeSnapshot(1),
      isComplete: false,
      finalTotal: null,
    }

    expect(() => createCalculationReportBlob(incompleteResult)).toThrow(
      'PDF export requires a complete calculation result',
    )
  })

  it('renders a multi-page final report for more than ten synthetic products', async () => {
    const snapshot = makeSnapshot(12)
    const buffer = await renderToBuffer(
      createCalculationReportDocument(snapshot),
    )
    const pdfStructure = buffer.toString('latin1')
    const pageObjects = pdfStructure.match(/\/Type \/Page\b/gu) ?? []

    expect(snapshot.finalTotal).toBe('1490000.00')
    expect(pageObjects.length).toBeGreaterThan(1)

    const outputPath = process.env.PDF_QA_OUTPUT
    if (outputPath) {
      const absolutePath = resolve(outputPath)
      await mkdir(dirname(absolutePath), { recursive: true })
      await writeFile(absolutePath, toBytes(buffer))
    }
  })
})
