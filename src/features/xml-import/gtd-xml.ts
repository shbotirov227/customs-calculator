import { z } from 'zod'

export const MAX_GTD_XML_BYTES = 512 * 1024

const importedItemSchema = z.object({
  position: z.number().int().positive(),
  hsCode: z.union([z.literal(''), z.string().regex(/^\d{10}$/u)]),
  description: z.string(),
  quantity: z.null(),
  unit: z.null(),
  customsValue: z.null(),
})

const importPreviewSchema = z.object({
  items: z.array(importedItemSchema).min(1).max(10),
  currency: z.null(),
  exchangeRateToUzs: z.null(),
})

export type GtdImportPreview = z.infer<typeof importPreviewSchema>

const directChildren = (element: Element, name: string) =>
  Array.from(element.children).filter((child) => child.localName === name)

const directText = (element: Element, name: string) =>
  directChildren(element, name)[0]?.textContent?.trim() ?? ''

const hasForbiddenMarkup = (document: Document) =>
  Array.from(document.getElementsByTagName('*')).some((element) =>
    ['script', 'style', 'iframe', 'object'].includes(
      element.localName.toLowerCase(),
    ),
  )

export const parseGtdXml = (xml: string): GtdImportPreview => {
  if (new Blob([xml]).size > MAX_GTD_XML_BYTES) {
    throw new Error('XML-файл превышает допустимый размер 512 КБ.')
  }

  if (/<!DOCTYPE|<!ENTITY/iu.test(xml)) {
    throw new Error('DOCTYPE и внешние сущности в XML запрещены.')
  }

  const document = new DOMParser().parseFromString(xml, 'application/xml')
  if (document.getElementsByTagName('parsererror').length > 0) {
    throw new Error('XML повреждён или имеет неверный формат.')
  }

  const root = document.documentElement
  if (root.localName !== 'GTD_eCopy_DefEdFormat') {
    throw new Error('Неподдерживаемый корневой элемент XML.')
  }

  if (hasForbiddenMarkup(document)) {
    throw new Error('Активная разметка внутри XML не поддерживается.')
  }

  const declarations = directChildren(root, 'T1')
  if (declarations.length !== 1) {
    throw new Error('Ожидался один блок декларации T1.')
  }

  const productNodes = directChildren(declarations[0], 'T2')
  if (productNodes.length === 0 || productNodes.length > 10) {
    throw new Error('XML должен содержать от 1 до 10 товарных позиций T2.')
  }

  return importPreviewSchema.parse({
    items: productNodes.map((node, index) => {
      const rawHsCode = directText(node, 'P9T2').replace(/\s+/gu, '')

      return {
        position: index + 1,
        hsCode: /^\d{10}$/u.test(rawHsCode) ? rawHsCode : '',
        description: directText(node, 'P4T2'),
        quantity: null,
        unit: null,
        customsValue: null,
      }
    }),
    currency: null,
    exchangeRateToUzs: null,
  })
}

export const parseGtdXmlFile = async (file: File) => {
  if (file.size > MAX_GTD_XML_BYTES) {
    throw new Error('XML-файл превышает допустимый размер 512 КБ.')
  }

  if (!file.name.toLowerCase().endsWith('.xml')) {
    throw new Error('Выберите файл с расширением .xml.')
  }

  return parseGtdXml(await file.text())
}
