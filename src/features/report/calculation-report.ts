import { createElement, type ReactElement } from "react";
import { pdf, type DocumentProps } from "@react-pdf/renderer";

import type { CalculationResult } from "@/types/calculation";
import { formatDate } from "@/utils/formatDate";
import {
  CalculationReportDocument,
  type CalculationReportKind,
  type CompleteCalculationResult,
} from "@/features/report/CalculationReportDocument";

const requireCompleteResult = (
  result: CalculationResult,
): CompleteCalculationResult => {
  if (!result.isComplete || result.finalTotal === null) {
    throw new Error("PDF export requires a complete calculation result");
  }

  return result as CompleteCalculationResult;
};

const createReportDocument = (
  result: CalculationResult,
  kind: CalculationReportKind,
) =>
  createElement(CalculationReportDocument, {
    result,
    kind,
  }) as ReactElement<DocumentProps>;

export const createCalculationReportDocument = (result: CalculationResult) =>
  createReportDocument(requireCompleteResult(result), "final");

export const createCalculationReportBlob = (result: CalculationResult) =>
  pdf(createCalculationReportDocument(result)).toBlob();

export const createDraftCalculationReportDocument = (result: CalculationResult) =>
  createReportDocument(result, "draft");

export const createDraftCalculationReportBlob = (result: CalculationResult) =>
  pdf(createDraftCalculationReportDocument(result)).toBlob();

export const getCalculationReportFilename = (result: CalculationResult) => {
  const completeResult = requireCompleteResult(result);
  return `customs-calculation-final-${formatDate(completeResult.calculationDate)}.pdf`;
};

export const getDraftCalculationReportFilename = (result: CalculationResult) =>
  `customs-calculation-draft-${formatDate(result.calculationDate)}.pdf`;
