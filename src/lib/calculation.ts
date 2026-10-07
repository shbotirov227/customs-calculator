import Decimal from 'decimal.js'
import { z } from 'zod'

const decimalPattern = /^\d+(?:[.,]\d+)?$/u

const decimalString = (label: string, allowZero: boolean) =>
  z
    .string()
    .trim()
    .min(1, `${label}: укажите значение`)
    .regex(decimalPattern, `${label}: используйте цифры и десятичный разделитель`)
    .refine((value) => {
      if (!decimalPattern.test(value)) return false

      const decimal = new Decimal(value.replace(',', '.'))
      return allowZero ? decimal.greaterThanOrEqualTo(0) : decimal.greaterThan(0)
    }, `${label}: значение должно быть ${allowZero ? 'неотрицательным' : 'больше нуля'}`)

const optionalDecimalString = z.union([
  z.literal(''),
  decimalString('Ставка', true),
])

const isoDateString = (label: string) =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/u, `${label}: укажите дату`)
    .refine((value) => {
      const [year, month, day] = value.split('-').map(Number)
      const date = new Date(Date.UTC(year, month - 1, day))

      return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
      )
    }, `${label}: дата не существует`)

const tariffTypeSchema = z.enum([
  'missing',
  'ad-valorem',
  'per-unit',
  'combined',
])

const calculationItemSchema = z
  .object({
    lineId: z.string().min(1),
    hsCode: z
      .string()
      .trim()
      .regex(/^\d{10}$/u, 'Код ТН ВЭД должен содержать 10 цифр'),
    description: z.string().trim().min(1, 'Укажите описание товара'),
    unit: z.string(),
    quantity: decimalString('Количество', false),
    customsValue: decimalString('Таможенная стоимость', false),
    tariffType: tariffTypeSchema,
    adValoremRate: optionalDecimalString,
    perUnitRate: optionalDecimalString,
    combinationRule: z.enum(['', 'max', 'sum']),
    rateSource: z.object({
      kind: z.enum(['manual', 'confirmed']),
      label: z.string().trim().min(1),
    }),
  })
  .superRefine((item, context) => {
    if (
      (item.tariffType === 'ad-valorem' ||
        item.tariffType === 'combined') &&
      item.adValoremRate === ''
    ) {
      context.addIssue({
        code: 'custom',
        path: ['adValoremRate'],
        message: 'Укажите процентную ставку',
      })
    }

    if (
      (item.tariffType === 'per-unit' || item.tariffType === 'combined') &&
      item.perUnitRate === ''
    ) {
      context.addIssue({
        code: 'custom',
        path: ['perUnitRate'],
        message: 'Укажите ставку за единицу',
      })
    }
  })

export const calculationInputSchema = z.object({
  calculationDate: isoDateString('Дата расчёта'),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/u, 'Укажите трёхбуквенный код валюты'),
  exchangeRateToUzs: decimalString('Курс валюты', false),
  exchangeRateDate: isoDateString('Дата курса'),
  clearanceFeeUzs: z.union([
    z.literal(''),
    decimalString('Сбор за оформление', true),
  ]),
  items: z
    .array(calculationItemSchema)
    .min(1, 'Добавьте хотя бы один товар')
    .max(10, 'Можно добавить не более 10 товаров'),
})

export type CalculationInput = z.infer<typeof calculationInputSchema>
export type PaymentStatus =
  | 'calculated'
  | 'zero'
  | 'not-applicable'
  | 'missing-input'
  | 'unsupported'

export type PaymentType =
  | 'customs-duty'
  | 'vat'
  | 'excise'
  | 'additional-duty'
  | 'clearance-fee'

export interface PaymentResult {
  type: PaymentType
  label: string
  base: string | null
  baseLabel: string
  rate: string | null
  rateLabel: string
  amount: string | null
  source: string
  sourceKind: 'manual' | 'confirmed' | 'missing'
  status: PaymentStatus
  message: string | null
}

export interface ItemCalculationResult {
  lineId: string
  hsCode: string
  description: string
  quantity: string
  unit: string
  customsValueUzs: string
  payments: PaymentResult[]
  knownSubtotal: string
}

export interface CalculationResult {
  calculationDate: string
  exchangeRateDate: string
  inputCurrency: string
  outputCurrency: 'UZS'
  exchangeRateToUzs: string
  items: ItemCalculationResult[]
  shipmentPayments: PaymentResult[]
  knownSubtotal: string
  finalTotal: string | null
  isComplete: boolean
}

const MONEY_SCALE = 2
const DECIMAL_ROUNDING = Decimal.ROUND_HALF_UP

const asDecimal = (value: string) => new Decimal(value.replace(',', '.'))
const asMoney = (value: Decimal) =>
  value.toDecimalPlaces(MONEY_SCALE, DECIMAL_ROUNDING).toFixed(MONEY_SCALE)

const missingPayment = (
  type: PaymentType,
  label: string,
  status: Extract<PaymentStatus, 'missing-input' | 'unsupported'>,
  message: string,
): PaymentResult => ({
  type,
  label,
  base: null,
  baseLabel: 'База не подтверждена',
  rate: null,
  rateLabel: 'Ставка отсутствует',
  amount: null,
  source: 'Нужен подтверждённый источник',
  sourceKind: 'missing',
  status,
  message,
})

const unavailableProductPayments = (): PaymentResult[] => [
  missingPayment(
    'vat',
    'НДС',
    'unsupported',
    'В источниках нет подтверждённой ставки и формулы базы НДС.',
  ),
  missingPayment(
    'excise',
    'Акциз',
    'unsupported',
    'В источниках нет подтверждённой ставки и правила применимости акциза.',
  ),
  missingPayment(
    'additional-duty',
    'Дополнительная пошлина',
    'unsupported',
    'Для выбора правила нужны подтверждённые данные о происхождении и применимой политике.',
  ),
]

const calculateDuty = (
  item: CalculationInput['items'][number],
  exchangeRate: Decimal,
  customsValueUzs: Decimal,
): PaymentResult => {
  if (item.tariffType === 'missing') {
    return missingPayment(
      'customs-duty',
      'Ввозная таможенная пошлина',
      'missing-input',
      'Ставка не найдена в каталоге. Введите её вручную, если у вас есть основание.',
    )
  }

  const sourceKind = item.rateSource.kind
  const source = item.rateSource.label
  let amount: Decimal
  let base: string
  let baseLabel: string
  let rate: string
  let rateLabel: string

  if (item.tariffType === 'ad-valorem') {
    rate = asDecimal(item.adValoremRate).toString()
    amount = customsValueUzs.mul(rate).div(100)
    base = asMoney(customsValueUzs)
    baseLabel = 'Таможенная стоимость, UZS'
    rateLabel = `${rate}%`
  } else if (item.tariffType === 'per-unit') {
    const quantity = asDecimal(item.quantity)
    const ratePerUnit = asDecimal(item.perUnitRate)
    rate = ratePerUnit.toString()
    amount = quantity.mul(ratePerUnit).mul(exchangeRate)
    base = quantity.toString()
    baseLabel = `Количество, ${item.unit || 'ед.'}`
    rateLabel = `${rate} ${item.rateSource.kind === 'manual' ? 'в валюте ввода' : ''} / ${item.unit || 'ед.'}`.trim()
  } else {
    if (item.combinationRule === '') {
      return missingPayment(
        'customs-duty',
        'Ввозная таможенная пошлина',
        'unsupported',
        'Для комбинированной ставки не подтверждено правило MAX или SUM.',
      )
    }

    const adValoremRate = asDecimal(item.adValoremRate)
    const perUnitRate = asDecimal(item.perUnitRate)
    const adValoremAmount = customsValueUzs.mul(adValoremRate).div(100)
    const perUnitAmount = asDecimal(item.quantity)
      .mul(perUnitRate)
      .mul(exchangeRate)

    amount =
      item.combinationRule === 'max'
        ? Decimal.max(adValoremAmount, perUnitAmount)
        : adValoremAmount.add(perUnitAmount)
    base = `${asMoney(customsValueUzs)} UZS; ${item.quantity} ${item.unit || 'ед.'}`
    baseLabel = 'Таможенная стоимость и количество'
    rate = `${adValoremRate.toString()}% / ${perUnitRate.toString()}`
    rateLabel = `${rate}; ${item.combinationRule.toUpperCase()}`
  }

  const roundedAmount = asMoney(amount)

  return {
    type: 'customs-duty',
    label: 'Ввозная таможенная пошлина',
    base,
    baseLabel,
    rate,
    rateLabel,
    amount: roundedAmount,
    source,
    sourceKind,
    status: new Decimal(roundedAmount).isZero() ? 'zero' : 'calculated',
    message:
      sourceKind === 'manual'
        ? 'Ставка введена пользователем и не подтверждена каталогом.'
        : null,
  }
}

export const calculateImportPayments = (
  input: CalculationInput,
): CalculationResult => {
  const exchangeRate = asDecimal(input.exchangeRateToUzs)
  const items = input.items.map((item) => {
    const customsValueUzs = asDecimal(item.customsValue).mul(exchangeRate)
    const payments = [
      calculateDuty(item, exchangeRate, customsValueUzs),
      ...unavailableProductPayments(),
    ]
    const knownSubtotal = payments.reduce(
      (total, payment) =>
        payment.amount === null ? total : total.add(payment.amount),
      new Decimal(0),
    )

    return {
      lineId: item.lineId,
      hsCode: item.hsCode,
      description: item.description,
      quantity: asDecimal(item.quantity).toString(),
      unit: item.unit,
      customsValueUzs: asMoney(customsValueUzs),
      payments,
      knownSubtotal: asMoney(knownSubtotal),
    }
  })

  const clearancePayment: PaymentResult =
    input.clearanceFeeUzs === ''
      ? missingPayment(
          'clearance-fee',
          'Сбор за таможенное оформление',
          'missing-input',
          'Размер сбора и правило его применения не предоставлены.',
        )
      : {
          type: 'clearance-fee',
          label: 'Сбор за таможенное оформление',
          base: '1',
          baseLabel: 'Одна отправка',
          rate: asMoney(asDecimal(input.clearanceFeeUzs)),
          rateLabel: 'Фиксированная сумма, UZS',
          amount: asMoney(asDecimal(input.clearanceFeeUzs)),
          source: 'Введено пользователем',
          sourceKind: 'manual',
          status: asDecimal(input.clearanceFeeUzs).isZero()
            ? 'zero'
            : 'calculated',
          message: 'Сумма введена пользователем и применяется один раз.',
        }

  const shipmentPayments = [clearancePayment]
  const allPayments = [
    ...items.flatMap(({ payments }) => payments),
    ...shipmentPayments,
  ]
  const knownSubtotal = allPayments.reduce(
    (total, payment) =>
      payment.amount === null ? total : total.add(payment.amount),
    new Decimal(0),
  )
  const isComplete = allPayments.every((payment) =>
    ['calculated', 'zero', 'not-applicable'].includes(payment.status),
  )

  return {
    calculationDate: input.calculationDate,
    exchangeRateDate: input.exchangeRateDate,
    inputCurrency: input.currency,
    outputCurrency: 'UZS',
    exchangeRateToUzs: exchangeRate.toString(),
    items,
    shipmentPayments,
    knownSubtotal: asMoney(knownSubtotal),
    finalTotal: isComplete ? asMoney(knownSubtotal) : null,
    isComplete,
  }
}
