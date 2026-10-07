import { FileUp } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { parseGtdXmlFile, type GtdImportPreview } from '@/lib/gtd-xml'

interface GtdXmlImportProps {
  onConfirm: (items: GtdImportPreview['items']) => void
}

export function GtdXmlImport({ onConfirm }: GtdXmlImportProps) {
  const [preview, setPreview] = useState<GtdImportPreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  const handleFile = async (file: File | undefined) => {
    if (!file) return

    setError(null)
    setIsImporting(true)

    try {
      setPreview(await parseGtdXmlFile(file))
    } catch (parseError) {
      setPreview(null)
      setError(
        parseError instanceof Error
          ? parseError.message
          : 'Не удалось прочитать XML-файл.',
      )
    } finally {
      setIsImporting(false)
    }
  }

  const confirmImport = () => {
    if (!preview) return

    onConfirm(preview.items)
    setPreview(null)
  }

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Импорт образца GTD XML</CardTitle>
          <CardDescription>
            Файл обрабатывается только в браузере. Поддерживается XML с корнем
            GTD_eCopy_DefEdFormat размером до 512 КБ; ZIP не загружается.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="w-full max-w-md">
              <Label htmlFor="gtd-xml">Файл XML</Label>
              <Input
                id="gtd-xml"
                type="file"
                accept=".xml,application/xml,text/xml"
                className="mt-1.5 file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium"
                disabled={isImporting}
                onChange={(event) => {
                  void handleFile(event.target.files?.[0])
                  event.target.value = ''
                }}
              />
            </div>
            <p className="flex items-center gap-2 text-xs text-zinc-500">
              <FileUp aria-hidden="true" className="size-4" />
              Сначала будет показан предпросмотр.
            </p>
          </div>
          {isImporting ? (
            <p className="mt-3 text-sm text-zinc-600">Чтение XML…</p>
          ) : null}
          {error ? (
            <p className="mt-3 text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Dialog
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) setPreview(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Предпросмотр импорта GTD XML</DialogTitle>
            <DialogDescription>
              Подтверждены только код ТН ВЭД и описание. Остальные поля нужно
              проверить и заполнить вручную до расчёта.
            </DialogDescription>
          </DialogHeader>

          {preview ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                Валюта и курс не сопоставлены: их XML-поля не подтверждены.
                Текущие значения формы будут сохранены.
              </div>

              <div className="space-y-3">
                {preview.items.map((item) => (
                  <div
                    key={item.position}
                    className="rounded-lg border p-3 text-sm"
                  >
                    <p className="font-medium">Товар {item.position}</p>
                    <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                      <div>
                        <dt className="text-xs text-zinc-500">Код ТН ВЭД</dt>
                        <dd className="font-mono">
                          {item.hsCode || 'Не найден или неверный формат'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-zinc-500">Описание</dt>
                        <dd>{item.description || 'Не найдено'}</dd>
                      </div>
                    </dl>
                    <p className="mt-2 text-xs leading-5 text-amber-800">
                      Не сопоставлены: количество, единица измерения и
                      таможенная стоимость.
                      {!item.hsCode ? ' Код ТН ВЭД требует ручного ввода.' : ''}
                      {!item.description
                        ? ' Описание требует ручного ввода.'
                        : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Отменить
              </Button>
            </DialogClose>
            <Button type="button" onClick={confirmImport}>
              Импортировать товары
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
