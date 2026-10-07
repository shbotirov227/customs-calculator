import { describe, expect, it } from 'vitest'

import { MAX_GTD_XML_BYTES, parseGtdXml, parseGtdXmlFile } from '@/lib/gtd-xml'

const syntheticXml = `<?xml version="1.0" encoding="UTF-8"?>
<GTD_eCopy_DefEdFormat>
  <T1>
    <T2><P4T2>Синтетический товар А</P4T2><P9T2>0123456789</P9T2></T2>
    <T2><P4T2>Синтетический товар Б</P4T2><P9T2>0123456789</P9T2></T2>
  </T1>
</GTD_eCopy_DefEdFormat>`

describe('GTD XML importer', () => {
  it('maps only confirmed fields and preserves duplicate product positions', () => {
    const preview = parseGtdXml(syntheticXml)

    expect(preview.items).toHaveLength(2)
    expect(preview.items[0]).toEqual({
      position: 1,
      hsCode: '0123456789',
      description: 'Синтетический товар А',
      quantity: null,
      unit: null,
      customsValue: null,
    })
    expect(preview.items[1].hsCode).toBe('0123456789')
    expect(preview.currency).toBeNull()
    expect(preview.exchangeRateToUzs).toBeNull()
  })

  it('keeps missing or invalid confirmed fields visible as empty values', () => {
    const preview = parseGtdXml(`
      <GTD_eCopy_DefEdFormat><T1><T2><P9T2>123</P9T2></T2></T1></GTD_eCopy_DefEdFormat>
    `)

    expect(preview.items[0].hsCode).toBe('')
    expect(preview.items[0].description).toBe('')
    expect(preview.items[0].quantity).toBeNull()
    expect(preview.items[0].customsValue).toBeNull()
  })

  it('rejects malformed XML and an unsupported root', () => {
    expect(() => parseGtdXml('<GTD_eCopy_DefEdFormat>')).toThrow(
      'XML повреждён',
    )
    expect(() => parseGtdXml('<OtherRoot />')).toThrow(
      'Неподдерживаемый корневой элемент',
    )
  })

  it('rejects DOCTYPE and active markup', () => {
    expect(() =>
      parseGtdXml(
        '<!DOCTYPE x [<!ENTITY y SYSTEM "file:///private">]><GTD_eCopy_DefEdFormat><T1><T2 /></T1></GTD_eCopy_DefEdFormat>',
      ),
    ).toThrow('DOCTYPE')
    expect(() =>
      parseGtdXml(
        '<GTD_eCopy_DefEdFormat><T1><T2><script>ignored</script></T2></T1></GTD_eCopy_DefEdFormat>',
      ),
    ).toThrow('Активная разметка')
  })

  it('rejects oversized and non-XML files before parsing', async () => {
    const oversized = new File(
      [new Uint8Array(MAX_GTD_XML_BYTES + 1)],
      'synthetic.xml',
      { type: 'application/xml' },
    )
    const wrongExtension = new File([syntheticXml], 'synthetic.txt')

    await expect(parseGtdXmlFile(oversized)).rejects.toThrow('512 КБ')
    await expect(parseGtdXmlFile(wrongExtension)).rejects.toThrow('.xml')
  })
})
