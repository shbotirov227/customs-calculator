import { access, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { readSheet } from 'read-excel-file/node'

const projectRoot = path.resolve(import.meta.dirname, '..')
const sourcePath = path.join(projectRoot, 'references', 'КОДЫ-НОВЫЕ.xlsx')
const outputPath = path.join(
  projectRoot,
  'src',
  'data',
  'product-catalog.json',
)
const expectedHeaders = ['Код', 'Код', 'Ед. изм.', 'Описание']

const isBlank = (value) => value == null || String(value).trim() === ''
const compactWhitespace = (value) => String(value).replace(/\s+/gu, '')
const normalizeText = (value) => String(value).replace(/\s+/gu, ' ').trim()

try {
  await access(sourcePath)
} catch {
  throw new Error(`Catalog source was not found: ${sourcePath}`)
}

const rows = await readSheet(sourcePath)
const headers = (rows[0] ?? []).map((value) =>
  value == null ? '' : String(value).trim(),
)

if (JSON.stringify(headers) !== JSON.stringify(expectedHeaders)) {
  throw new Error(
    `Unexpected catalog columns. Expected ${JSON.stringify(expectedHeaders)}, received ${JSON.stringify(headers)}`,
  )
}

const catalog = []
const seenCodes = new Set()
const duplicateCodes = new Set()
let blankRows = 0
let leadingZeroCodes = 0
let missingUnits = 0

for (const [index, row] of rows.slice(1).entries()) {
  if (row.every(isBlank)) {
    blankRows += 1
    continue
  }

  const sourceRow = index + 2
  const rawCode = row[1]
  const rawDescription = row[3]

  if (isBlank(rawCode)) {
    throw new Error(`Missing HS code at source row ${sourceRow}`)
  }

  if (typeof rawCode !== 'string') {
    throw new Error(`HS code is not text at source row ${sourceRow}`)
  }

  const code = compactWhitespace(rawCode)
  if (!/^\d{10}$/u.test(code)) {
    throw new Error(`HS code is not 10 digits at source row ${sourceRow}`)
  }

  if (isBlank(rawDescription)) {
    throw new Error(`Missing description at source row ${sourceRow}`)
  }

  if (seenCodes.has(code)) {
    duplicateCodes.add(code)
  }
  seenCodes.add(code)

  if (code.startsWith('0')) {
    leadingZeroCodes += 1
  }

  const unit = isBlank(row[2]) ? null : normalizeText(row[2])
  if (unit === null) {
    missingUnits += 1
  }

  catalog.push({
    code,
    description: normalizeText(rawDescription),
    unit,
  })
}

if (duplicateCodes.size > 0) {
  throw new Error(
    `Duplicate HS codes found (${duplicateCodes.size}); conversion stopped without merging them`,
  )
}

catalog.sort((left, right) => left.code.localeCompare(right.code))

await mkdir(path.dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(catalog)}\n`, 'utf8')

console.log(
  JSON.stringify(
    {
      records: catalog.length,
      blankRows,
      duplicateCodes: duplicateCodes.size,
      leadingZeroCodes,
      missingUnits,
      ratesIncluded: false,
    },
    null,
    2,
  ),
)
