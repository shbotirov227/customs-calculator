# Uzbekistan Import Customs Calculator

A source-constrained demo calculator built with React, TypeScript, and Vite. The application searches a local HS catalog, calculates supported payment components for multiple products, imports the supported GTD XML sample through a guarded preview flow, and generates PDF reports from calculation snapshots.

## Getting started

Requirements: Node.js and npm.

```bash
npm install
npm run dev
```

Available verification commands:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run preview
```

## Included functionality

- HS catalog search by code prefix or description.
- Add, edit, duplicate, and remove 1–10 product lines.
- React Hook Form state management with Zod validation.
- Decimal-safe monetary calculations with a single rounding policy.
- Explicit handling for missing, manual, confirmed, unsupported, and zero-rate states.
- Stale-result detection that prevents exporting outdated snapshots.
- Final PDF export for complete calculations and clearly labelled draft PDF export for incomplete calculations.
- Cyrillic-compatible PDF font embedding and multi-page reports.
- Client-only GTD XML preview, validation, cancellation, and confirmation flow.

## XML import

The importer accepts only XML documents with the `GTD_eCopy_DefEdFormat` root. Files containing `DOCTYPE`, external entities, active HTML or script markup, an unsupported root, or more than 512 KB are rejected.

Only HS codes and descriptions with confirmed semantics are mapped from XML. Quantity, unit, customs value, currency, exchange rate, and tariff data are not inferred. Missing fields are shown in the preview and must be completed manually.

The root-level `test.xml` file is intentionally rejected if it is not a valid GTD document. Use a synthetic GTD XML document for local testing. Real GTD party, company, address, banking, or identifier data must never be copied into source code, tests, logs, or public assets.

## Calculation limitations

The catalog contains codes and descriptions, not tariff rates. The supplied source package does not fully confirm base customs-duty rates, VAT, excise, all applicable fees, exchange-rate policy, or the `MAX`/`SUM` rule for combined tariffs.

Therefore:

- an unknown rate is never treated as zero;
- manually entered rates are visibly distinguished from confirmed sources;
- incomplete calculations do not expose a final total;
- final PDF export is available only for a complete, current snapshot;
- draft PDFs are explicitly marked and are not official customs calculations.

The application output is not a customs declaration, legal opinion, or official customs assessment.

## Data protection

`references/`, raw PDF/XLSX/XML/ZIP files, and private GTD records are excluded from Git and production bundles. XML files are parsed locally in the browser and are not uploaded to a server. Tests use synthetic data only.

## Vercel deployment

The application does not use a router, so no SPA rewrite is required.

1. Import the repository into a Vercel project.
2. Select the **Vite** framework preset.
3. Set the build command to `npm run build`.
4. Use `dist` as the output directory.
5. After deployment, smoke-test catalog search, product editing, XML preview, PDF export, and responsive layouts.

This repository does not perform automatic commits, pushes, or deployments.
