import { Calculator, Copy, Info, Plus, Trash2 } from 'lucide-react'
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form'

import { CatalogSearch } from '@/components/catalog-search'
import { GtdXmlImport } from '@/components/gtd-xml-import'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CalculationInput } from '@/lib/calculation'
import { createEmptyCalculationItem } from '@/lib/calculation-input'
import type { GtdImportPreview } from '@/lib/gtd-xml'

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-red-700">{message}</p> : null
}

interface CalculationFormProps {
  onSubmit: (values: CalculationInput) => void
}

export function CalculationForm({ onSubmit }: CalculationFormProps) {
  const {
    control,
    clearErrors,
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useFormContext<CalculationInput>()
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'items',
  })
  const formValues = useWatch({ control })

  const confirmXmlImport = (items: GtdImportPreview['items']) => {
    replace(
      items.map((item) => ({
        ...createEmptyCalculationItem(),
        hsCode: item.hsCode,
        description: item.description,
        quantity: '',
        unit: '',
        customsValue: '',
      })),
    )
    clearErrors('items')
  }

  return (
    <>
      <GtdXmlImport onConfirm={confirmXmlImport} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Параметры расчёта</CardTitle>
            <CardDescription>
              Курс вводится вручную как количество UZS за одну единицу выбранной
              валюты.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <Label htmlFor="calculationDate">Дата расчёта</Label>
              <Input
                id="calculationDate"
                type="date"
                className="mt-1.5"
                {...register('calculationDate')}
              />
              <FieldError message={errors.calculationDate?.message} />
            </div>
            <div>
              <Label htmlFor="currency">Валюта стоимости</Label>
              <select
                id="currency"
                className="mt-1.5 flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                {...register('currency')}
              >
                <option value="UZS">UZS</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="RUB">RUB</option>
                <option value="CNY">CNY</option>
              </select>
              <FieldError message={errors.currency?.message} />
            </div>
            <div>
              <Label htmlFor="exchangeRateToUzs">Курс к UZS</Label>
              <Input
                id="exchangeRateToUzs"
                inputMode="decimal"
                className="mt-1.5"
                placeholder="1"
                {...register('exchangeRateToUzs')}
              />
              <FieldError message={errors.exchangeRateToUzs?.message} />
            </div>
            <div>
              <Label htmlFor="exchangeRateDate">Дата курса</Label>
              <Input
                id="exchangeRateDate"
                type="date"
                className="mt-1.5"
                {...register('exchangeRateDate')}
              />
              <FieldError message={errors.exchangeRateDate?.message} />
            </div>
            <div>
              <Label htmlFor="clearanceFeeUzs">Сбор за оформление, UZS</Label>
              <Input
                id="clearanceFeeUzs"
                inputMode="decimal"
                className="mt-1.5"
                placeholder="Нет данных"
                {...register('clearanceFeeUzs')}
              />
              <FieldError message={errors.clearanceFeeUzs?.message} />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Товары</h2>
            <p className="mt-1 text-sm text-zinc-500">От 1 до 10 позиций</p>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={fields.length >= 10}
            onClick={() => append(createEmptyCalculationItem())}
          >
            <Plus aria-hidden="true" />
            Добавить товар
          </Button>
        </div>

        {fields.map((field, index) => {
          const tariffType = formValues.items?.[index]?.tariffType ?? 'missing'

          return (
            <Card key={field.id}>
              <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-lg">Товар {index + 1}</CardTitle>
                  <CardDescription>
                    Выберите запись из каталога или заполните поля вручную.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    aria-label={`Копировать товар ${index + 1}`}
                    disabled={fields.length >= 10}
                    onClick={() => {
                      const item = getValues(`items.${index}`)
                      append({
                        ...item,
                        lineId: createEmptyCalculationItem().lineId,
                      })
                    }}
                  >
                    <Copy aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    aria-label={`Удалить товар ${index + 1}`}
                    disabled={fields.length === 1}
                    onClick={() => remove(index)}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <CatalogSearch
                  onSelect={(item) => {
                    setValue(`items.${index}.hsCode`, item.code, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                    setValue(`items.${index}.description`, item.description, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                    setValue(`items.${index}.unit`, item.unit ?? '', {
                      shouldDirty: true,
                    })
                  }}
                />

                <input type="hidden" {...register(`items.${index}.lineId`)} />
                <input
                  type="hidden"
                  {...register(`items.${index}.rateSource.kind`)}
                />
                <input
                  type="hidden"
                  {...register(`items.${index}.rateSource.label`)}
                />
                <input
                  type="hidden"
                  {...register(`items.${index}.combinationRule`)}
                />

                <div className="grid gap-5 lg:grid-cols-12">
                  <div className="lg:col-span-3">
                    <Label htmlFor={`hs-${field.id}`}>Код ТН ВЭД</Label>
                    <Input
                      id={`hs-${field.id}`}
                      className="mt-1.5 font-mono"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="10 цифр"
                      {...register(`items.${index}.hsCode`)}
                    />
                    <FieldError
                      message={errors.items?.[index]?.hsCode?.message}
                    />
                  </div>
                  <div className="lg:col-span-7">
                    <Label htmlFor={`description-${field.id}`}>Описание</Label>
                    <textarea
                      id={`description-${field.id}`}
                      rows={3}
                      className="mt-1.5 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      {...register(`items.${index}.description`)}
                    />
                    <FieldError
                      message={errors.items?.[index]?.description?.message}
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <Label htmlFor={`unit-${field.id}`}>Ед. измерения</Label>
                    <Input
                      id={`unit-${field.id}`}
                      className="mt-1.5"
                      placeholder="шт"
                      {...register(`items.${index}.unit`)}
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <Label htmlFor={`quantity-${field.id}`}>Количество</Label>
                    <Input
                      id={`quantity-${field.id}`}
                      inputMode="decimal"
                      className="mt-1.5"
                      {...register(`items.${index}.quantity`)}
                    />
                    <FieldError
                      message={errors.items?.[index]?.quantity?.message}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`value-${field.id}`}>
                      Таможенная стоимость
                    </Label>
                    <Input
                      id={`value-${field.id}`}
                      inputMode="decimal"
                      className="mt-1.5"
                      placeholder="В выбранной валюте"
                      {...register(`items.${index}.customsValue`)}
                    />
                    <FieldError
                      message={errors.items?.[index]?.customsValue?.message}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor={`tariff-${field.id}`}>
                      Тип ставки пошлины
                    </Label>
                    <select
                      id={`tariff-${field.id}`}
                      className="mt-1.5 flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      {...register(`items.${index}.tariffType`)}
                    >
                      <option value="missing">Ставка неизвестна</option>
                      <option value="ad-valorem">Процент от стоимости</option>
                      <option value="per-unit">Ставка за единицу</option>
                      <option value="combined">Комбинированная</option>
                    </select>
                  </div>
                </div>

                {tariffType !== 'missing' ? (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <div className="mb-4 flex items-center gap-2 text-sm font-medium text-blue-950">
                      <Info aria-hidden="true" className="size-4" />
                      Ставка вводится вручную и не подтверждена каталогом
                    </div>
                    <div className="grid gap-5 sm:grid-cols-3">
                      {tariffType === 'ad-valorem' ||
                      tariffType === 'combined' ? (
                        <div>
                          <Label htmlFor={`ad-rate-${field.id}`}>
                            Ставка, %
                          </Label>
                          <Input
                            id={`ad-rate-${field.id}`}
                            inputMode="decimal"
                            className="mt-1.5 bg-white"
                            {...register(`items.${index}.adValoremRate`)}
                          />
                          <FieldError
                            message={
                              errors.items?.[index]?.adValoremRate?.message
                            }
                          />
                        </div>
                      ) : null}
                      {tariffType === 'per-unit' ||
                      tariffType === 'combined' ? (
                        <div>
                          <Label htmlFor={`unit-rate-${field.id}`}>
                            Ставка за единицу
                          </Label>
                          <Input
                            id={`unit-rate-${field.id}`}
                            inputMode="decimal"
                            className="mt-1.5 bg-white"
                            {...register(`items.${index}.perUnitRate`)}
                          />
                          <FieldError
                            message={
                              errors.items?.[index]?.perUnitRate?.message
                            }
                          />
                        </div>
                      ) : null}
                      {tariffType === 'combined' ? (
                        <div>
                          <Label>Правило комбинации</Label>
                          <div className="mt-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                            MAX или SUM не подтверждены источниками. Такой
                            расчёт останется неподдерживаемым.
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                    Ставка не найдена. Пошлина останется в состоянии «Нужны
                    данные» и не будет заменена нулём.
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        {errors.items?.root?.message ? (
          <p className="text-sm text-red-700">{errors.items.root.message}</p>
        ) : null}

        <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-2xl border bg-white/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-zinc-500">
            Итог не будет показан, пока обязательные правила отсутствуют.
          </p>
          <Button type="submit" size="lg" disabled={isSubmitting}>
            <Calculator aria-hidden="true" />
            Рассчитать
          </Button>
        </div>
      </form>
    </>
  )
}
