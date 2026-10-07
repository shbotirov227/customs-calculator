import { createElement, type ReactElement } from 'react'
import { pdf, type DocumentProps } from '@react-pdf/renderer'

import type { CalculationResult } from '@/lib/calculation'
import {
  CalculationReportDocument,
  type CompleteCalculationResult,
} from '@/lib/calculation-report-document'

const requireCompleteResult = (
  result: CalculationResult,
): CompleteCalculationResult => {
  if (!result.isComplete || result.finalTotal === null) {
    throw new Error('PDF export requires a complete calculation result')
  }

  return result as CompleteCalculationResult
}

export const createCalculationReportDocument = (result: CalculationResult) =>
  createElement(CalculationReportDocument, {
    result: requireCompleteResult(result),
  }) as ReactElement<DocumentProps>

export const createCalculationReportBlob = (result: CalculationResult) =>
  pdf(createCalculationReportDocument(result)).toBlob()

export const getCalculationReportFilename = (result: CalculationResult) => {
  const completeResult = requireCompleteResult(result)
  return `customs-calculation-final-${completeResult.calculationDate}.pdf`
}
