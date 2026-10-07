import type { CalculationInput } from '@/lib/calculation'

const createLineId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `line-${Date.now()}-${Math.random().toString(16).slice(2)}`

export const createEmptyCalculationItem =
  (): CalculationInput['items'][number] => ({
    lineId: createLineId(),
    hsCode: '',
    description: '',
    unit: '',
    quantity: '1',
    customsValue: '',
    tariffType: 'missing',
    adValoremRate: '',
    perUnitRate: '',
    combinationRule: '',
    rateSource: {
      kind: 'manual',
      label: 'Введено пользователем',
    },
  })
