# Project Engineering Guide

## Purpose

This repository contains a source-constrained demo calculator for import customs payments in Uzbekistan. It is not an official customs declaration, legal opinion, or production customs assessment.

## Technology baseline

- React, strict TypeScript, and Vite
- Tailwind CSS 4 with shadcn/ui-style Radix primitives
- React Hook Form and Zod
- TanStack Query
- `decimal.js` for monetary arithmetic
- `@react-pdf/renderer` for PDF reports
- Vitest and Testing Library

## Architecture and responsibilities

- `src/domain/` contains framework-independent calculation models and pure functions.
- `src/features/calculator/` contains the form, product rows, result presentation, and page flow.
- `src/features/catalog/` contains catalog search behavior.
- `src/features/xml-import/` contains GTD XML parsing, preview, validation, and confirmation.
- `src/features/report/` creates final or draft PDF reports from calculation snapshots.
- `src/components/ui/` contains reusable UI primitives. Business rules do not belong here.
- `src/data/` contains the generated local product catalog.
- `src/types/` contains shared domain and data types.
- `src/utils/` contains focused formatting and form helpers.
- `src/validation/` contains Zod schemas.
- `tests/` contains domain, feature, and integration tests.

## Coding standards

1. React Hook Form is the single owner of form state. Do not add a second global store.
2. Product rows use `useFieldArray` and stable `lineId` values.
3. UI components must not duplicate calculation formulas. They render results returned by `src/domain/calculation.ts`.
4. Monetary calculations must remain in `Decimal`; do not convert the calculation chain to `Number`.
5. HS codes are strings and must preserve leading zeroes.
6. A catalog code or description does not imply that a tariff is known.
7. An unknown rate must never become `0`. Confirmed zero, manual input, and missing input are distinct states.
8. A calculation becomes stale when its inputs change. Stale snapshots must not be exported.
9. Final PDF export is allowed only for a complete result. An incomplete result may produce only an explicitly labelled draft PDF containing known intermediate amounts.
10. A shipment-level fee must be applied once per shipment, not once per product.
11. Add a file only when it represents a distinct responsibility or enables meaningful independent testing. Do not add barrels, generic factories, dependency-injection containers, or abstraction layers without a concrete need.

## Source handling and privacy

- `references/` and raw PDF, XLSX, XML, ZIP, and image files are analysis sources only.
- Raw sources must not be copied into `public/`, `dist/`, fixtures, logs, or application code.
- Real GTD parties, companies, addresses, bank details, and identifiers must never enter the repository.
- Tests must use synthetic data.
- XML is parsed locally in the browser and is never uploaded. Enforce the file-size limit and reject unsupported roots, `DOCTYPE`, external entities, and active markup.
- XML import may map only fields whose semantics are confirmed. Do not infer quantity, unit, value, currency, exchange rate, or tariff rules from tag names.

## Calculation policy

The supplied sources do not fully confirm base tariff rates, VAT, excise, all fees, exchange-rate policy, or the `MAX`/`SUM` rule for combined tariffs. The engine must return these cases as `missing-input` or `unsupported`. Add a rate or formula only when an authoritative source and its effective date are documented.

## Change workflow

Before changing code, inspect `git status`, this guide, `docs/TASK.md`, and the relevant feature tests. Preserve existing user changes. After code changes, run:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Do not report browser flows as verified when they were not tested in a real browser. Commit, push, and deployment require an explicit request.

## Planned work

- Complete a dated policy model from authoritative sources for tariffs, VAT, excise, fees, and exchange rates.
- Model origin country, supporting documents, HS coverage, and effective dates for policy decisions.
- Verify desktop and 390px mobile layouts in a real browser.
- Preserve the current minimal data boundary if a future API replaces the local catalog.
