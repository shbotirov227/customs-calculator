import {
  AlertTriangle,
  CheckCircle2,
  Download,
  LoaderCircle,
} from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type {
  CalculationResult,
  PaymentResult,
  PaymentStatus,
} from '@/lib/calculation'

const statusLabels: Record<PaymentStatus, string> = {
  calculated: 'Рассчитано',
  zero: 'Нулевая ставка',
  'not-applicable': 'Не применяется',
  'missing-input': 'Нужны данные',
  unsupported: 'Нет подтверждённого правила',
}

const statusStyles: Record<PaymentStatus, string> = {
  calculated: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  zero: 'bg-blue-50 text-blue-800 ring-blue-200',
  'not-applicable': 'bg-zinc-100 text-zinc-700 ring-zinc-200',
  'missing-input': 'bg-amber-50 text-amber-900 ring-amber-200',
  unsupported: 'bg-red-50 text-red-800 ring-red-200',
}

const sourceKindLabels: Record<PaymentResult['sourceKind'], string> = {
  manual: 'Ручной ввод',
  confirmed: 'Подтверждённый источник',
  missing: 'Источник отсутствует',
}

const sourceKindStyles: Record<PaymentResult['sourceKind'], string> = {
  manual: 'bg-blue-50 text-blue-800 ring-blue-200',
  confirmed: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  missing: 'bg-amber-50 text-amber-900 ring-amber-200',
}

const formatDecimal = (value: string | null) => {
  if (value === null) return '—'

  const [integer, fraction] = value.split('.')
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/gu, ' ')
  return fraction === undefined ? grouped : `${grouped},${fraction}`
}

function PaymentRow({ payment }: { payment: PaymentResult }) {
  return (
    <div className="grid gap-3 border-t px-4 py-4 first:border-t-0 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
      <div>
        <p className="text-sm font-medium text-zinc-950">{payment.label}</p>
        <span
          className={`mt-2 inline-flex rounded-full px-2 py-1 text-[11px] font-medium ring-1 ring-inset ${statusStyles[payment.status]}`}
        >
          {statusLabels[payment.status]}
        </span>
      </div>
      <div>
        <p className="text-xs text-zinc-500">База</p>
        <p className="mt-1 text-sm font-medium">
          {formatDecimal(payment.base)}
        </p>
        <p className="mt-0.5 text-xs text-zinc-500">{payment.baseLabel}</p>
      </div>
      <div>
        <p className="text-xs text-zinc-500">Ставка и источник</p>
        <p className="mt-1 text-sm font-medium">{payment.rateLabel}</p>
        <p className="mt-0.5 text-xs text-zinc-500">{payment.source}</p>
        <span
          className={`mt-2 inline-flex rounded-full px-2 py-1 text-[11px] font-medium ring-1 ring-inset ${sourceKindStyles[payment.sourceKind]}`}
        >
          {sourceKindLabels[payment.sourceKind]}
        </span>
      </div>
      <div className="lg:text-right">
        <p className="text-xs text-zinc-500">Сумма</p>
        <p className="mt-1 font-mono text-sm font-semibold">
          {payment.amount === null
            ? '—'
            : `${formatDecimal(payment.amount)} UZS`}
        </p>
        {payment.message ? (
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            {payment.message}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export function CalculationResults({ result }: { result: CalculationResult }) {
  const [exportState, setExportState] = useState<
    'idle' | 'exporting' | 'error'
  >('idle')

  const downloadReport = async () => {
    if (!result.isComplete || result.finalTotal === null) return

    setExportState('exporting')

    try {
      const { createCalculationReportBlob, getCalculationReportFilename } =
        await import('@/lib/calculation-report')
      const blob = await createCalculationReportBlob(result)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = getCalculationReportFilename(result)
      link.click()
      URL.revokeObjectURL(url)
      setExportState('idle')
    } catch {
      setExportState('error')
    }
  }

  return (
    <section className="space-y-5" aria-labelledby="results-title">
      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle id="results-title">Результат расчёта</CardTitle>
            <CardDescription className="mt-1">
              Курс: 1 {result.inputCurrency} ={' '}
              {formatDecimal(result.exchangeRateToUzs)} UZS, дата курса{' '}
              {result.exchangeRateDate}
            </CardDescription>
          </div>
          {result.isComplete ? (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
              <CheckCircle2 aria-hidden="true" className="size-3.5" />
              Расчёт полный
            </span>
          ) : (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 ring-1 ring-amber-200">
              <AlertTriangle aria-hidden="true" className="size-3.5" />
              Расчёт неполный
            </span>
          )}
        </CardHeader>
        <CardContent>
          <div className="rounded-xl bg-zinc-950 p-5 text-white">
            <p className="text-xs text-zinc-400">
              {result.isComplete
                ? 'Итого по отправке'
                : 'Известная промежуточная сумма'}
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold sm:text-3xl">
              {formatDecimal(result.finalTotal ?? result.knownSubtotal)} UZS
            </p>
            {!result.isComplete ? (
              <p className="mt-3 max-w-2xl text-xs leading-5 text-zinc-400">
                Это не итоговая сумма: для НДС, акциза и дополнительной пошлины
                нет подтверждённых ставок и формул базы.
              </p>
            ) : null}
            <div className="mt-5 flex flex-col items-start gap-2 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="secondary"
                disabled={
                  !result.isComplete ||
                  result.finalTotal === null ||
                  exportState === 'exporting'
                }
                onClick={downloadReport}
              >
                {exportState === 'exporting' ? (
                  <LoaderCircle aria-hidden="true" className="animate-spin" />
                ) : (
                  <Download aria-hidden="true" />
                )}
                Скачать итоговый PDF
              </Button>
              <p className="text-xs text-zinc-400">
                {result.isComplete
                  ? 'PDF формируется из показанного результата без повторного расчёта.'
                  : 'Экспорт недоступен: сначала нужны все подтверждённые ставки и правила.'}
              </p>
            </div>
            {exportState === 'error' ? (
              <p className="mt-2 text-xs text-red-300" role="alert">
                Не удалось сформировать PDF. Попробуйте ещё раз.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {result.items.map((item, index) => (
        <Card key={item.lineId}>
          <CardHeader>
            <CardTitle className="text-base">
              Товар {index + 1}: {item.hsCode}
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {item.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <div className="border-y">
              {item.payments.map((payment) => (
                <PaymentRow key={payment.type} payment={payment} />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Платежи по отправке</CardTitle>
          <CardDescription>
            Сбор за оформление применяется здесь один раз, а не для каждого
            товара.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <div className="border-y">
            {result.shipmentPayments.map((payment) => (
              <PaymentRow key={payment.type} payment={payment} />
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
