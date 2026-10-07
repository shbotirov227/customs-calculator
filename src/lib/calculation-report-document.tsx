import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'
import notoSansBold from '@fontsource/noto-sans/files/noto-sans-cyrillic-700-normal.woff?inline'
import notoSansRegular from '@fontsource/noto-sans/files/noto-sans-cyrillic-400-normal.woff?inline'

import type {
  CalculationResult,
  PaymentResult,
  PaymentStatus,
} from '@/lib/calculation'

Font.register({
  family: 'Noto Sans',
  fonts: [
    { src: notoSansRegular, fontWeight: 400 },
    { src: notoSansBold, fontWeight: 700 },
  ],
})
Font.registerHyphenationCallback((word) => [word])

const styles = StyleSheet.create({
  page: {
    paddingTop: 34,
    paddingRight: 34,
    paddingBottom: 44,
    paddingLeft: 34,
    fontFamily: 'Noto Sans',
    fontSize: 8.5,
    lineHeight: 1.45,
    color: '#27272a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#d4d4d8',
  },
  eyebrow: { color: '#71717a', fontSize: 7.5, marginBottom: 3 },
  title: { fontSize: 18, fontWeight: 700, color: '#18181b' },
  documentStatus: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 3,
    backgroundColor: '#dcfce7',
    color: '#166534',
    fontWeight: 700,
    fontSize: 8,
  },
  metadata: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 4,
  },
  metaCell: { width: '50%', padding: 8 },
  metaLabel: { color: '#71717a', fontSize: 7, marginBottom: 2 },
  metaValue: { fontWeight: 700 },
  sectionTitle: {
    marginTop: 18,
    marginBottom: 7,
    fontSize: 12,
    fontWeight: 700,
    color: '#18181b',
  },
  item: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#d4d4d8',
    borderRadius: 4,
  },
  itemHeader: {
    padding: 9,
    backgroundColor: '#f4f4f5',
    borderBottomWidth: 1,
    borderBottomColor: '#d4d4d8',
  },
  itemTitle: { fontWeight: 700, fontSize: 9.5, marginBottom: 3 },
  itemDescription: { color: '#52525b' },
  itemSummary: {
    marginTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    color: '#3f3f46',
  },
  paymentHeader: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 7,
    backgroundColor: '#fafafa',
    color: '#71717a',
    fontSize: 6.5,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
  },
  paymentRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
  },
  colPayment: { width: '23%', paddingRight: 6 },
  colBase: { width: '22%', paddingRight: 6 },
  colRate: { width: '20%', paddingRight: 6 },
  colSource: { width: '22%', paddingRight: 6 },
  colAmount: { width: '13%', textAlign: 'right' },
  paymentName: { fontWeight: 700, marginBottom: 2 },
  secondary: { color: '#71717a', fontSize: 7 },
  status: { marginTop: 3, fontSize: 6.5, color: '#52525b' },
  amount: { fontWeight: 700 },
  shipment: {
    borderWidth: 1,
    borderColor: '#d4d4d8',
    borderRadius: 4,
  },
  totalBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#18181b',
    color: '#ffffff',
    borderRadius: 4,
  },
  totalLabel: { color: '#d4d4d8', fontSize: 8 },
  totalValue: { marginTop: 4, fontSize: 16, fontWeight: 700 },
  footerLeft: {
    position: 'absolute',
    left: 34,
    bottom: 20,
    color: '#a1a1aa',
    fontSize: 6.5,
  },
})

const statusLabels: Record<PaymentStatus, string> = {
  calculated: 'Рассчитано',
  zero: 'Нулевая ставка',
  'not-applicable': 'Не применяется',
  'missing-input': 'Нужны данные',
  unsupported: 'Нет подтверждённого правила',
}

const sourceKindLabels: Record<PaymentResult['sourceKind'], string> = {
  manual: 'Ручной ввод',
  confirmed: 'Подтверждённый источник',
  missing: 'Источник отсутствует',
}

export type CompleteCalculationResult = CalculationResult & {
  isComplete: true
  finalTotal: string
}

const formatDecimal = (value: string | null) => {
  if (value === null) return 'Нет данных'

  const [integer, fraction] = value.split('.')
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/gu, ' ')
  return fraction === undefined ? grouped : `${grouped},${fraction}`
}

function PaymentColumns({ payment }: { payment: PaymentResult }) {
  return (
    <View style={styles.paymentRow} wrap={false}>
      <View style={styles.colPayment}>
        <Text style={styles.paymentName}>{payment.label}</Text>
        <Text style={styles.status}>{statusLabels[payment.status]}</Text>
      </View>
      <View style={styles.colBase}>
        <Text>{formatDecimal(payment.base)}</Text>
        <Text style={styles.secondary}>{payment.baseLabel}</Text>
      </View>
      <View style={styles.colRate}>
        <Text>{payment.rateLabel}</Text>
      </View>
      <View style={styles.colSource}>
        <Text>{payment.source}</Text>
        <Text style={styles.secondary}>
          {sourceKindLabels[payment.sourceKind]}
        </Text>
        {payment.message ? (
          <Text style={styles.secondary}>{payment.message}</Text>
        ) : null}
      </View>
      <View style={styles.colAmount}>
        <Text style={styles.amount}>
          {payment.status === 'not-applicable'
            ? 'Не применяется'
            : payment.amount === null
              ? 'Нет данных'
              : `${formatDecimal(payment.amount)} UZS`}
        </Text>
      </View>
    </View>
  )
}

function PaymentTable({ payments }: { payments: PaymentResult[] }) {
  return (
    <View>
      <View style={styles.paymentHeader} wrap={false}>
        <Text style={styles.colPayment}>Платёж и статус</Text>
        <Text style={styles.colBase}>База</Text>
        <Text style={styles.colRate}>Ставка</Text>
        <Text style={styles.colSource}>Источник</Text>
        <Text style={styles.colAmount}>Сумма</Text>
      </View>
      {payments.map((payment) => (
        <PaymentColumns key={payment.type} payment={payment} />
      ))}
    </View>
  )
}

export function CalculationReportDocument({
  result,
}: {
  result: CompleteCalculationResult
}) {
  return (
    <Document
      title="Расчёт таможенных платежей"
      author="Демо калькулятор импорта в Узбекистан"
      subject="Расчёт сформирован из сохранённого снимка результата"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>ДЕМО ИМПОРТА В УЗБЕКИСТАН</Text>
            <Text style={styles.title}>Расчёт таможенных платежей</Text>
          </View>
          <Text style={styles.documentStatus}>ИТОГОВЫЙ РАСЧЁТ</Text>
        </View>

        <View style={styles.metadata}>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>ДАТА РАСЧЁТА</Text>
            <Text style={styles.metaValue}>{result.calculationDate}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>ДАТА КУРСА</Text>
            <Text style={styles.metaValue}>{result.exchangeRateDate}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>ВАЛЮТА</Text>
            <Text style={styles.metaValue}>{result.inputCurrency}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>КУРС</Text>
            <Text style={styles.metaValue}>
              1 {result.inputCurrency} ={' '}
              {formatDecimal(result.exchangeRateToUzs)} UZS
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Товары</Text>
        {result.items.map((item, index) => (
          <View key={item.lineId} style={styles.item} wrap={false}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>
                Товар {index + 1}. Код ТН ВЭД: {item.hsCode}
              </Text>
              <Text style={styles.itemDescription}>{item.description}</Text>
              <View style={styles.itemSummary}>
                <Text>
                  Количество: {formatDecimal(item.quantity)} {item.unit || 'ед.'}
                </Text>
                <Text>
                  Таможенная стоимость: {formatDecimal(item.customsValueUzs)} UZS
                </Text>
              </View>
              <Text style={styles.itemSummary}>
                Итого по товару: {formatDecimal(item.knownSubtotal)} UZS
              </Text>
            </View>
            <PaymentTable payments={item.payments} />
          </View>
        ))}

        <Text style={styles.sectionTitle} minPresenceAhead={100}>
          Платежи по отправке
        </Text>
        <View style={styles.shipment}>
          <PaymentTable payments={result.shipmentPayments} />
        </View>

        <View style={styles.totalBox} wrap={false}>
          <Text style={styles.totalLabel}>ИТОГО ПО ОТПРАВКЕ</Text>
          <Text style={styles.totalValue}>
            {formatDecimal(result.finalTotal)} UZS
          </Text>
        </View>

        <Text style={styles.footerLeft} fixed>
          Сформировано из сохранённого результата расчёта
        </Text>
      </Page>
    </Document>
  )
}
