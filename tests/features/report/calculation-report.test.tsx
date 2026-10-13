// @vitest-environment node
/// <reference types="node" />

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";

import type { CalculationResult, PaymentResult } from "@/types/calculation";
import { calculateImportPayments } from "@/domain/calculation";
import type { CalculationInput } from "@/types/calculation";
import {
  createCalculationReportBlob,
  createCalculationReportDocument,
  createDraftCalculationReportDocument,
  getDraftCalculationReportFilename,
  getCalculationReportFilename,
} from "@/features/report/calculation-report";

type CompleteSyntheticResult = CalculationResult & {
  isComplete: true;
  finalTotal: string;
};

const notApplicablePayment = (
  type: Extract<PaymentResult["type"], "vat" | "excise" | "additional-duty">,
  label: string,
): PaymentResult => ({
  type,
  label,
  base: null,
  baseLabel: "Не применяется в синтетическом snapshot",
  rate: null,
  rateLabel: "Ставка отсутствует",
  amount: null,
  source: "Синтетический подтверждённый источник",
  sourceKind: "confirmed",
  status: "not-applicable",
  message: null,
});

const makeInput = (itemCount: number): CalculationInput => ({
  calculationDate: "2026-10-08",
  currency: "USD",
  exchangeRateToUzs: "12000",
  exchangeRateDate: "2026-10-08",
  clearanceFeeUzs: "50000",
  items: Array.from({ length: itemCount }, (_, index) => ({
    lineId: `synthetic-${index + 1}`,
    hsCode: `${index + 1}`.padStart(10, "0"),
    description: `Синтетический товар ${index + 1}. Данные не относятся к реальной декларации.`,
    unit: "шт",
    quantity: "2",
    customsValue: "100",
    tariffType: "ad-valorem",
    adValoremRate: "10",
    perUnitRate: "",
    combinationRule: "",
    rateSource: {
      kind: "confirmed",
      label: "Синтетический подтверждённый источник",
    },
  })),
});

const makeCompleteReportSnapshot = (
  result: CalculationResult,
): CompleteSyntheticResult => ({
  ...result,
  items: result.items.map((item) => ({
    ...item,
    payments: item.payments.map((payment) =>
      payment.status === "unsupported"
        ? notApplicablePayment(
            payment.type as "vat" | "excise" | "additional-duty",
            payment.label,
          )
        : payment,
    ),
  })),
  finalTotal: result.knownSubtotal,
  isComplete: true,
});

const toBytes = (buffer: Buffer) => new Uint8Array(buffer);

describe("calculation PDF report", () => {
  it("renders a one-product final report from a supplied result snapshot", async () => {
    const snapshot = makeCompleteReportSnapshot(
      calculateImportPayments(makeInput(1)),
    );
    const buffer = await renderToBuffer(
      createCalculationReportDocument(snapshot),
    );

    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
    expect(buffer.byteLength).toBeGreaterThan(10_000);
    expect(getCalculationReportFilename(snapshot)).toBe(
      "customs-calculation-final-08-10-2026.pdf",
    );
  });

  it("blocks PDF generation for an incomplete result", () => {
    const incompleteResult: CalculationResult = {
      ...makeCompleteReportSnapshot(calculateImportPayments(makeInput(1))),
      isComplete: false,
      finalTotal: null,
    };

    expect(() => createCalculationReportBlob(incompleteResult)).toThrow(
      "PDF export requires a complete calculation result",
    );
  });

  it("renders an explicitly marked draft from an incomplete snapshot", async () => {
    const incompleteResult: CalculationResult = {
      ...calculateImportPayments(makeInput(1)),
      finalTotal: null,
      isComplete: false,
    };
    const buffer = await renderToBuffer(
      createDraftCalculationReportDocument(incompleteResult),
    );

    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
    expect(getDraftCalculationReportFilename(incompleteResult)).toBe(
      "customs-calculation-draft-08-10-2026.pdf",
    );
  });

  it("renders a multi-page final report for more than ten synthetic products", async () => {
    const engineResult = calculateImportPayments(makeInput(12));
    const snapshot = makeCompleteReportSnapshot(engineResult);
    const buffer = await renderToBuffer(
      createCalculationReportDocument(snapshot),
    );
    const pdfStructure = buffer.toString("latin1");
    const pageObjects = pdfStructure.match(/\/Type \/Page\b/gu) ?? [];

    expect(snapshot.finalTotal).toBe(engineResult.knownSubtotal);
    expect(snapshot.finalTotal).toBe("1490000.00");
    expect(pageObjects.length).toBeGreaterThan(1);

    const outputPath = process.env.PDF_QA_OUTPUT;
    if (outputPath) {
      const absolutePath = resolve(outputPath);
      await mkdir(dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, toBytes(buffer));
    }
  });
});
