import { Calculator, Copy, Plus, Trash2 } from "lucide-react";
import {
  Controller,
  useFieldArray,
  useFormContext,
  useWatch,
} from "react-hook-form";

import { CatalogSearch } from "@/features/catalog/CatalogSearch";
import { GtdXmlImport } from "@/features/xml-import/GtdXmlImport";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/DatePicker";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { createEmptyCalculationItem } from "@/utils/calculation-form";
import { formatPrice, normalizePriceInput } from "@/utils/formatPrice";
import type { GtdImportPreview } from "@/features/xml-import/gtd-xml";
import type { CalculationInput } from "@/types/calculation";

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className="mt-1 text-xs text-red-700" role="alert">
      {message}
    </p>
  ) : null;
}

const validationProps = (errorId: string, message?: string) => ({
  "aria-invalid": message ? true : undefined,
  "aria-describedby": message ? errorId : undefined,
});

const fieldErrorId = (id: string) => `${id}-error`;

interface CalculationFormProps {
  onSubmit: (values: CalculationInput) => void;
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
  } = useFormContext<CalculationInput>();
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "items",
  });
  const formValues = useWatch({ control });

  const confirmXmlImport = (items: GtdImportPreview["items"]) => {
    replace(
      items.map((item) => ({
        ...createEmptyCalculationItem(),
        hsCode: item.hsCode,
        description: item.description,
        quantity: "",
        unit: "",
        customsValue: "",
      })),
    );
    clearErrors("items");
  };

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
              <Controller
                control={control}
                name="calculationDate"
                render={({ field }) => (
                  <DatePicker
                    id="calculationDate"
                    label="Дата расчёта"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    inputRef={field.ref}
                    {...validationProps(
                      fieldErrorId("calculationDate"),
                      errors.calculationDate?.message,
                    )}
                  />
                )}
              />
              <FieldError
                id={fieldErrorId("calculationDate")}
                message={errors.calculationDate?.message}
              />
            </div>
            <div>
              <Label id="currency-label">Валюта стоимости</Label>
              <Controller
                control={control}
                name="currency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="currency"
                      aria-labelledby="currency-label"
                      className="mt-1.5"
                      ref={field.ref}
                      onBlur={field.onBlur}
                      {...validationProps(
                        fieldErrorId("currency"),
                        errors.currency?.message,
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UZS">UZS</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="RUB">RUB</SelectItem>
                      <SelectItem value="CNY">CNY</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError
                id={fieldErrorId("currency")}
                message={errors.currency?.message}
              />
            </div>
            <div>
              <Label htmlFor="exchangeRateToUzs">Курс к UZS</Label>
              <Controller
                control={control}
                name="exchangeRateToUzs"
                render={({ field }) => (
                  <Input
                    id="exchangeRateToUzs"
                    inputMode="decimal"
                    className="mt-1.5"
                    placeholder="1"
                    value={formatPrice(field.value)}
                    onChange={(event) =>
                      field.onChange(normalizePriceInput(event.target.value))
                    }
                    onBlur={field.onBlur}
                    ref={field.ref}
                    {...validationProps(
                      fieldErrorId("exchangeRateToUzs"),
                      errors.exchangeRateToUzs?.message,
                    )}
                  />
                )}
              />
              <FieldError
                id={fieldErrorId("exchangeRateToUzs")}
                message={errors.exchangeRateToUzs?.message}
              />
            </div>
            <div>
              <Label htmlFor="exchangeRateDate">Дата курса</Label>
              <Controller
                control={control}
                name="exchangeRateDate"
                render={({ field }) => (
                  <DatePicker
                    id="exchangeRateDate"
                    label="Дата курса"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    inputRef={field.ref}
                    {...validationProps(
                      fieldErrorId("exchangeRateDate"),
                      errors.exchangeRateDate?.message,
                    )}
                  />
                )}
              />
              <FieldError
                id={fieldErrorId("exchangeRateDate")}
                message={errors.exchangeRateDate?.message}
              />
            </div>
            <div>
              <Label htmlFor="clearanceFeeUzs">Сбор за оформление, UZS</Label>
              <Controller
                control={control}
                name="clearanceFeeUzs"
                render={({ field }) => (
                  <Input
                    id="clearanceFeeUzs"
                    inputMode="decimal"
                    className="mt-1.5"
                    placeholder="Нет данных"
                    value={formatPrice(field.value)}
                    onChange={(event) =>
                      field.onChange(normalizePriceInput(event.target.value))
                    }
                    onBlur={field.onBlur}
                    ref={field.ref}
                    {...validationProps(
                      fieldErrorId("clearanceFeeUzs"),
                      errors.clearanceFeeUzs?.message,
                    )}
                  />
                )}
              />
              <FieldError
                id={fieldErrorId("clearanceFeeUzs")}
                message={errors.clearanceFeeUzs?.message}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 py-0">
          <CardHeader className="flex flex-row items-center justify-between gap-4 border-b px-5 py-4">
            <div>
              <CardTitle className="text-xl">Товары</CardTitle>
              <CardDescription className="mt-1">
                От 1 до 10 позиций
              </CardDescription>
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
          </CardHeader>

          <CardContent className="space-y-2 px-0 py-0">
            <p className="px-4 pt-3 text-xs text-zinc-500 sm:hidden">
              Таблицу можно прокручивать по горизонтали.
            </p>
            <div className="overflow-hidden rounded-b-xl">
              <Table className="min-w-280 border-separate border-spacing-0 bg-background [&_tbody_td]:border-border [&_tbody_td]:bg-card [&_tbody_td:not(:last-child)]:border-r">
                <TableCaption className="sr-only">
                  Товары и параметры ручного расчёта пошлины
                </TableCaption>
                <TableHeader className="bg-background [&_th]:font-semibold [&_th]:text-foreground">
                  <TableRow className="border-b-2">
                    <TableHead
                      scope="col"
                      className="w-[320px] border-r border-border"
                    >
                      Товар
                    </TableHead>
                    <TableHead
                      scope="col"
                      className="w-28 border-r border-border"
                    >
                      Ед. изм.
                    </TableHead>
                    <TableHead
                      scope="col"
                      className="w-32 border-r border-border"
                    >
                      Количество
                    </TableHead>
                    <TableHead
                      scope="col"
                      className="w-44 border-r border-border"
                    >
                      Таможенная стоимость
                    </TableHead>
                    <TableHead
                      scope="col"
                      className="w-64 border-r border-border"
                    >
                      Тип и ставка пошлины
                    </TableHead>
                    <TableHead scope="col" className="w-24 text-right">
                      Действия
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="[&_tr:not(:last-child)_td]:border-b-2">
                  {fields.map((field, index) => {
                    const tariffType =
                      formValues.items?.[index]?.tariffType ?? "missing";

                    return (
                      <TableRow
                        key={field.id}
                        aria-label={`Товар ${index + 1}`}
                      >
                        <TableCell>
                          <div className="space-y-3">
                            <p className="font-medium">Товар {index + 1}</p>
                            <CatalogSearch
                              onSelect={(item) => {
                                setValue(`items.${index}.hsCode`, item.code, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });
                                setValue(
                                  `items.${index}.description`,
                                  item.description,
                                  {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                  },
                                );
                                setValue(
                                  `items.${index}.unit`,
                                  item.unit ?? "",
                                  {
                                    shouldDirty: true,
                                  },
                                );
                              }}
                            />
                            <input
                              type="hidden"
                              {...register(`items.${index}.lineId`)}
                            />
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
                            <div>
                              <Label
                                className="sr-only"
                                htmlFor={`hs-${field.id}`}
                              >
                                Код ТН ВЭД
                              </Label>
                              <Input
                                id={`hs-${field.id}`}
                                className="font-mono"
                                inputMode="numeric"
                                maxLength={10}
                                placeholder="Код ТН ВЭД, 10 цифр"
                                {...register(`items.${index}.hsCode`)}
                                {...validationProps(
                                  fieldErrorId(`hs-${field.id}`),
                                  errors.items?.[index]?.hsCode?.message,
                                )}
                              />
                              <FieldError
                                id={fieldErrorId(`hs-${field.id}`)}
                                message={errors.items?.[index]?.hsCode?.message}
                              />
                            </div>
                            <div>
                              <Label
                                className="sr-only"
                                htmlFor={`description-${field.id}`}
                              >
                                Описание
                              </Label>
                              <Textarea
                                id={`description-${field.id}`}
                                rows={10}
                                placeholder="Описание товара"
                                {...register(`items.${index}.description`)}
                                {...validationProps(
                                  fieldErrorId(`description-${field.id}`),
                                  errors.items?.[index]?.description?.message,
                                )}
                              />
                              <FieldError
                                id={fieldErrorId(`description-${field.id}`)}
                                message={
                                  errors.items?.[index]?.description?.message
                                }
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Label
                            className="sr-only"
                            htmlFor={`unit-${field.id}`}
                          >
                            Ед. измерения
                          </Label>
                          <Input
                            id={`unit-${field.id}`}
                            placeholder="шт"
                            {...register(`items.${index}.unit`)}
                            {...validationProps(
                              fieldErrorId(`unit-${field.id}`),
                              errors.items?.[index]?.unit?.message,
                            )}
                          />
                          <FieldError
                            id={fieldErrorId(`unit-${field.id}`)}
                            message={errors.items?.[index]?.unit?.message}
                          />
                        </TableCell>
                        <TableCell>
                          <Label
                            className="sr-only"
                            htmlFor={`quantity-${field.id}`}
                          >
                            Количество
                          </Label>
                          <Input
                            id={`quantity-${field.id}`}
                            inputMode="decimal"
                            {...register(`items.${index}.quantity`)}
                            {...validationProps(
                              fieldErrorId(`quantity-${field.id}`),
                              errors.items?.[index]?.quantity?.message,
                            )}
                          />
                          <FieldError
                            id={fieldErrorId(`quantity-${field.id}`)}
                            message={errors.items?.[index]?.quantity?.message}
                          />
                        </TableCell>
                        <TableCell>
                          <Label
                            className="sr-only"
                            htmlFor={`value-${field.id}`}
                          >
                            Таможенная стоимость
                          </Label>
                          <Controller
                            control={control}
                            name={`items.${index}.customsValue`}
                            render={({ field: priceField }) => (
                              <Input
                                id={`value-${field.id}`}
                                inputMode="decimal"
                                placeholder="В выбранной валюте"
                                value={formatPrice(priceField.value)}
                                onChange={(event) =>
                                  priceField.onChange(
                                    normalizePriceInput(event.target.value),
                                  )
                                }
                                onBlur={priceField.onBlur}
                                ref={priceField.ref}
                                {...validationProps(
                                  fieldErrorId(`value-${field.id}`),
                                  errors.items?.[index]?.customsValue?.message,
                                )}
                              />
                            )}
                          />
                          <FieldError
                            id={fieldErrorId(`value-${field.id}`)}
                            message={
                              errors.items?.[index]?.customsValue?.message
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Label
                            className="sr-only"
                            id={`tariff-label-${field.id}`}
                          >
                            Тип ставки пошлины
                          </Label>
                          <Controller
                            control={control}
                            name={`items.${index}.tariffType`}
                            render={({ field: tariffField }) => (
                              <Select
                                value={tariffField.value}
                                onValueChange={tariffField.onChange}
                              >
                                <SelectTrigger
                                  id={`tariff-${field.id}`}
                                  aria-labelledby={`tariff-label-${field.id}`}
                                  ref={tariffField.ref}
                                  onBlur={tariffField.onBlur}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="missing">
                                    Ставка неизвестна
                                  </SelectItem>
                                  <SelectItem value="ad-valorem">
                                    Процент от стоимости
                                  </SelectItem>
                                  <SelectItem value="per-unit">
                                    Ставка за единицу
                                  </SelectItem>
                                  <SelectItem value="combined">
                                    Комбинированная
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                          {tariffType !== "missing" ? (
                            <div className="mt-3 space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                              <Alert variant="info" className="p-0" role="note">
                                <AlertDescription className="text-xs font-medium">
                                  Ставка вводится вручную и не подтверждена
                                  каталогом
                                </AlertDescription>
                              </Alert>
                              {tariffType === "ad-valorem" ||
                                tariffType === "combined" ? (
                                <div>
                                  <Label
                                    className="sr-only"
                                    htmlFor={`ad-rate-${field.id}`}
                                  >
                                    Ставка, %
                                  </Label>
                                  <Input
                                    id={`ad-rate-${field.id}`}
                                    inputMode="decimal"
                                    placeholder="Ставка, %"
                                    {...register(
                                      `items.${index}.adValoremRate`,
                                    )}
                                    {...validationProps(
                                      fieldErrorId(`ad-rate-${field.id}`),
                                      errors.items?.[index]?.adValoremRate
                                        ?.message,
                                    )}
                                  />
                                  <FieldError
                                    id={fieldErrorId(`ad-rate-${field.id}`)}
                                    message={
                                      errors.items?.[index]?.adValoremRate
                                        ?.message
                                    }
                                  />
                                </div>
                              ) : null}
                              {tariffType === "per-unit" ||
                                tariffType === "combined" ? (
                                <div>
                                  <Label
                                    className="sr-only"
                                    htmlFor={`unit-rate-${field.id}`}
                                  >
                                    Ставка за единицу
                                  </Label>
                                  <Input
                                    id={`unit-rate-${field.id}`}
                                    inputMode="decimal"
                                    placeholder="Ставка за единицу"
                                    {...register(`items.${index}.perUnitRate`)}
                                    {...validationProps(
                                      fieldErrorId(`unit-rate-${field.id}`),
                                      errors.items?.[index]?.perUnitRate
                                        ?.message,
                                    )}
                                  />
                                  <FieldError
                                    id={fieldErrorId(`unit-rate-${field.id}`)}
                                    message={
                                      errors.items?.[index]?.perUnitRate
                                        ?.message
                                    }
                                  />
                                </div>
                              ) : null}
                              {tariffType === "combined" ? (
                                <Alert variant="warning" role="note">
                                  <AlertDescription className="text-xs">
                                    MAX или SUM не подтверждены источниками.
                                    Такой расчёт останется неподдерживаемым.
                                  </AlertDescription>
                                </Alert>
                              ) : null}
                            </div>
                          ) : (
                            <Alert
                              variant="warning"
                              className="mt-3"
                              role="note"
                            >
                              <AlertDescription className="text-xs">
                                Ставка не найдена. Пошлина останется в состоянии
                                «Нужны данные» и не будет заменена нулём.
                              </AlertDescription>
                            </Alert>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              aria-label={`Копировать товар ${index + 1}`}
                              disabled={fields.length >= 10}
                              onClick={() => {
                                const item = getValues(`items.${index}`);
                                append({
                                  ...item,
                                  lineId: createEmptyCalculationItem().lineId,
                                });
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
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {errors.items?.root?.message ? (
          <p className="text-sm text-red-700" role="alert">
            {errors.items.root.message}
          </p>
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
  );
}
