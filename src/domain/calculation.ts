import Decimal from "decimal.js";
import type {
  CalculationInput,
  CalculationResult,
  PaymentResult,
  PaymentStatus,
  PaymentType,
} from "@/types/calculation";

const MONEY_SCALE = 2;
const DECIMAL_ROUNDING = Decimal.ROUND_HALF_UP;

const asDecimal = (value: string) => new Decimal(value.replace(",", "."));
const asMoney = (value: Decimal) =>
  value.toDecimalPlaces(MONEY_SCALE, DECIMAL_ROUNDING).toFixed(MONEY_SCALE);

const missingPayment = (
  type: PaymentType,
  label: string,
  status: Extract<PaymentStatus, "missing-input" | "unsupported">,
  message: string,
): PaymentResult => ({
  type,
  label,
  base: null,
  baseLabel: "База не подтверждена",
  rate: null,
  rateLabel: "Ставка отсутствует",
  amount: null,
  source: "Нужен подтверждённый источник",
  sourceKind: "missing",
  status,
  message,
});

const unavailableProductPayments = (): PaymentResult[] => [
  missingPayment(
    "vat",
    "НДС",
    "unsupported",
    "В источниках нет подтверждённой ставки и формулы базы НДС.",
  ),
  missingPayment(
    "excise",
    "Акциз",
    "unsupported",
    "В источниках нет подтверждённой ставки и правила применимости акциза.",
  ),
  missingPayment(
    "additional-duty",
    "Дополнительная пошлина",
    "unsupported",
    "Для выбора правила нужны подтверждённые данные о происхождении и применимой политике.",
  ),
];

const calculateDuty = (
  item: CalculationInput["items"][number],
  exchangeRate: Decimal,
  customsValueUzs: Decimal,
): PaymentResult => {
  if (item.tariffType === "missing") {
    return missingPayment(
      "customs-duty",
      "Ввозная таможенная пошлина",
      "missing-input",
      "Ставка не найдена в каталоге. Введите её вручную, если у вас есть основание.",
    );
  }

  const sourceKind = item.rateSource.kind;
  const source = item.rateSource.label;
  let amount: Decimal;
  let base: string;
  let baseLabel: string;
  let rate: string;
  let rateLabel: string;

  if (item.tariffType === "ad-valorem") {
    rate = asDecimal(item.adValoremRate).toString();
    amount = customsValueUzs.mul(rate).div(100);
    base = asMoney(customsValueUzs);
    baseLabel = "Таможенная стоимость, UZS";
    rateLabel = `${rate}%`;
  } else if (item.tariffType === "per-unit") {
    const quantity = asDecimal(item.quantity);
    const ratePerUnit = asDecimal(item.perUnitRate);
    rate = ratePerUnit.toString();
    amount = quantity.mul(ratePerUnit).mul(exchangeRate);
    base = quantity.toString();
    baseLabel = `Количество, ${item.unit || "ед."}`;
    rateLabel =
      `${rate} ${item.rateSource.kind === "manual" ? "в валюте ввода" : ""} / ${item.unit || "ед."}`.trim();
  } else {
    if (item.combinationRule === "") {
      return missingPayment(
        "customs-duty",
        "Ввозная таможенная пошлина",
        "unsupported",
        "Для комбинированной ставки не подтверждено правило MAX или SUM.",
      );
    }

    const adValoremRate = asDecimal(item.adValoremRate);
    const perUnitRate = asDecimal(item.perUnitRate);
    const adValoremAmount = customsValueUzs.mul(adValoremRate).div(100);
    const perUnitAmount = asDecimal(item.quantity)
      .mul(perUnitRate)
      .mul(exchangeRate);

    amount =
      item.combinationRule === "max"
        ? Decimal.max(adValoremAmount, perUnitAmount)
        : adValoremAmount.add(perUnitAmount);
    base = `${asMoney(customsValueUzs)} UZS; ${item.quantity} ${item.unit || "ед."}`;
    baseLabel = "Таможенная стоимость и количество";
    rate = `${adValoremRate.toString()}% / ${perUnitRate.toString()}`;
    rateLabel = `${rate}; ${item.combinationRule.toUpperCase()}`;
  }

  const roundedAmount = asMoney(amount);

  return {
    type: "customs-duty",
    label: "Ввозная таможенная пошлина",
    base,
    baseLabel,
    rate,
    rateLabel,
    amount: roundedAmount,
    source,
    sourceKind,
    status: new Decimal(roundedAmount).isZero() ? "zero" : "calculated",
    message:
      sourceKind === "manual"
        ? "Ставка введена пользователем и не подтверждена каталогом."
        : null,
  };
};

export const calculateImportPayments = (
  input: CalculationInput,
): CalculationResult => {
  const exchangeRate = asDecimal(input.exchangeRateToUzs);
  const items = input.items.map((item) => {
    const customsValueUzs = asDecimal(item.customsValue).mul(exchangeRate);
    const payments = [
      calculateDuty(item, exchangeRate, customsValueUzs),
      ...unavailableProductPayments(),
    ];
    const knownSubtotal = payments.reduce(
      (total, payment) =>
        payment.amount === null ? total : total.add(payment.amount),
      new Decimal(0),
    );

    return {
      lineId: item.lineId,
      hsCode: item.hsCode,
      description: item.description,
      quantity: asDecimal(item.quantity).toString(),
      unit: item.unit,
      customsValueUzs: asMoney(customsValueUzs),
      payments,
      knownSubtotal: asMoney(knownSubtotal),
    };
  });

  const clearancePayment: PaymentResult =
    input.clearanceFeeUzs === ""
      ? missingPayment(
          "clearance-fee",
          "Сбор за таможенное оформление",
          "missing-input",
          "Размер сбора и правило его применения не предоставлены.",
        )
      : {
          type: "clearance-fee",
          label: "Сбор за таможенное оформление",
          base: "1",
          baseLabel: "Одна отправка",
          rate: asMoney(asDecimal(input.clearanceFeeUzs)),
          rateLabel: "Фиксированная сумма, UZS",
          amount: asMoney(asDecimal(input.clearanceFeeUzs)),
          source: "Введено пользователем",
          sourceKind: "manual",
          status: asDecimal(input.clearanceFeeUzs).isZero()
            ? "zero"
            : "calculated",
          message: "Сумма введена пользователем и применяется один раз.",
        };

  const shipmentPayments = [clearancePayment];
  const allPayments = [
    ...items.flatMap(({ payments }) => payments),
    ...shipmentPayments,
  ];
  const knownSubtotal = allPayments.reduce(
    (total, payment) =>
      payment.amount === null ? total : total.add(payment.amount),
    new Decimal(0),
  );
  const isComplete = allPayments.every((payment) =>
    ["calculated", "zero", "not-applicable"].includes(payment.status),
  );

  return {
    calculationDate: input.calculationDate,
    exchangeRateDate: input.exchangeRateDate,
    inputCurrency: input.currency,
    outputCurrency: "UZS",
    exchangeRateToUzs: exchangeRate.toString(),
    items,
    shipmentPayments,
    knownSubtotal: asMoney(knownSubtotal),
    finalTotal: isComplete ? asMoney(knownSubtotal) : null,
    isComplete,
  };
};
