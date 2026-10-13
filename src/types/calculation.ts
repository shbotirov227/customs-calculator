import type { z } from "zod";

import type { calculationInputSchema } from "@/validation/calculation-schema";

export type CalculationInput = z.infer<typeof calculationInputSchema>;

export type PaymentStatus =
  "calculated" | "zero" | "not-applicable" | "missing-input" | "unsupported";

export type PaymentType =
  "customs-duty" | "vat" | "excise" | "additional-duty" | "clearance-fee";

export interface PaymentResult {
  type: PaymentType;
  label: string;
  base: string | null;
  baseLabel: string;
  rate: string | null;
  rateLabel: string;
  amount: string | null;
  source: string;
  sourceKind: "manual" | "confirmed" | "missing";
  status: PaymentStatus;
  message: string | null;
}

export interface ItemCalculationResult {
  lineId: string;
  hsCode: string;
  description: string;
  quantity: string;
  unit: string;
  customsValueUzs: string;
  payments: PaymentResult[];
  knownSubtotal: string;
}

export interface CalculationResult {
  calculationDate: string;
  exchangeRateDate: string;
  inputCurrency: string;
  outputCurrency: "UZS";
  exchangeRateToUzs: string;
  items: ItemCalculationResult[];
  shipmentPayments: PaymentResult[];
  knownSubtotal: string;
  finalTotal: string | null;
  isComplete: boolean;
}
