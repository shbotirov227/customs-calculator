import Decimal from "decimal.js";
import { z } from "zod";

import { normalizeDate } from "@/utils/formatDate";

const decimalPattern = /^\d+(?:[.,]\d+)?$/u;

const decimalString = (label: string, allowZero: boolean) =>
  z
    .string()
    .trim()
    .min(1, `${label}: укажите значение`)
    .regex(
      decimalPattern,
      `${label}: используйте цифры и десятичный разделитель`,
    )
    .refine(
      (value) => {
        if (!decimalPattern.test(value)) return false;

        const decimal = new Decimal(value.replace(",", "."));
        return allowZero
          ? decimal.greaterThanOrEqualTo(0)
          : decimal.greaterThan(0);
      },
      `${label}: значение должно быть ${allowZero ? "неотрицательным" : "больше нуля"}`,
    );

const optionalDecimalString = z.union([
  z.literal(""),
  decimalString("Ставка", true),
]);

const isoDateString = (label: string) =>
  z
    .string()
    .transform(normalizeDate)
    .pipe(
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/u, `${label}: укажите дату`)
        .refine((value) => {
          const [year, month, day] = value.split("-").map(Number);
          const date = new Date(Date.UTC(year, month - 1, day));

          return (
            date.getUTCFullYear() === year &&
            date.getUTCMonth() === month - 1 &&
            date.getUTCDate() === day
          );
        }, `${label}: дата не существует`),
    );

const tariffTypeSchema = z.enum([
  "missing",
  "ad-valorem",
  "per-unit",
  "combined",
]);

const calculationItemSchema = z
  .object({
    lineId: z.string().min(1),
    hsCode: z
      .string()
      .trim()
      .regex(/^\d{10}$/u, "Код ТН ВЭД должен содержать 10 цифр"),
    description: z.string().trim().min(1, "Укажите описание товара"),
    unit: z.string(),
    quantity: decimalString("Количество", false),
    customsValue: decimalString("Таможенная стоимость", false),
    tariffType: tariffTypeSchema,
    adValoremRate: optionalDecimalString,
    perUnitRate: optionalDecimalString,
    combinationRule: z.enum(["", "max", "sum"]),
    rateSource: z.object({
      kind: z.enum(["manual", "confirmed"]),
      label: z.string().trim().min(1),
    }),
  })
  .superRefine((item, context) => {
    if (
      (item.tariffType === "per-unit" || item.tariffType === "combined") &&
      item.unit.trim() === ""
    ) {
      context.addIssue({
        code: "custom",
        path: ["unit"],
        message: "Укажите единицу измерения для ставки за единицу",
      });
    }

    if (
      (item.tariffType === "ad-valorem" || item.tariffType === "combined") &&
      item.adValoremRate === ""
    ) {
      context.addIssue({
        code: "custom",
        path: ["adValoremRate"],
        message: "Укажите процентную ставку",
      });
    }

    if (
      (item.tariffType === "per-unit" || item.tariffType === "combined") &&
      item.perUnitRate === ""
    ) {
      context.addIssue({
        code: "custom",
        path: ["perUnitRate"],
        message: "Укажите ставку за единицу",
      });
    }
  });

export const calculationInputSchema = z.object({
  calculationDate: isoDateString("Дата расчёта"),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/u, "Укажите трёхбуквенный код валюты"),
  exchangeRateToUzs: decimalString("Курс валюты", false),
  exchangeRateDate: isoDateString("Дата курса"),
  clearanceFeeUzs: z.union([
    z.literal(""),
    decimalString("Сбор за оформление", true),
  ]),
  items: z
    .array(calculationItemSchema)
    .min(1, "Добавьте хотя бы один товар")
    .max(10, "Можно добавить не более 10 товаров"),
});

export type CalculationInput = z.infer<typeof calculationInputSchema>;
