import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  Download,
  Info,
} from "lucide-react";
import { useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { CalculationForm } from "@/features/calculator/CalculationForm";
import { CalculationResults } from "@/features/calculator/CalculationResults";
import { Card, CardContent } from "@/components/ui/Card";
import { calculateImportPayments } from "@/domain/calculation";
import type { CalculationInput, CalculationResult } from "@/types/calculation";
import { createEmptyCalculationItem } from "@/utils/calculation-form";
import { calculationInputSchema } from "@/validation/calculation-schema";

const today = new Date().toISOString().slice(0, 10);

export function CalculatorPage() {
  const [calculation, setCalculation] = useState<{
    snapshot: string;
    result: CalculationResult;
  } | null>(null);
  const form = useForm<CalculationInput>({
    resolver: zodResolver(calculationInputSchema),
    mode: "onTouched",
    defaultValues: {
      calculationDate: today,
      currency: "UZS",
      exchangeRateToUzs: "1",
      exchangeRateDate: today,
      clearanceFeeUzs: "",
      items: [createEmptyCalculationItem()],
    },
  });
  const formValues = useWatch({ control: form.control });
  const currentSnapshot = JSON.stringify(formValues);
  const isResultStale =
    calculation !== null && calculation.snapshot !== currentSnapshot;

  const onSubmit = (values: CalculationInput) => {
    setCalculation({
      snapshot: JSON.stringify(form.getValues()),
      result: calculateImportPayments(values),
    });
  };

  return (
    <FormProvider {...form}>
      <main className="min-h-svh bg-zinc-100 text-zinc-950">
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
            <span className="flex size-9 items-center justify-center rounded-xl bg-zinc-950 text-white">
              <Calculator aria-hidden="true" className="size-4" />
            </span>
            <div>
              <p className="font-semibold">Таможенный калькулятор</p>
              <p className="text-xs text-zinc-500">Демо импорта в Узбекистан</p>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Расчёт импортных платежей
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600 sm:text-base">
              Выберите товар из локального каталога и укажите известную ставку.
              Каталог содержит коды и описания, но не тарифы.
            </p>
          </div>

          <Alert variant="warning" className="mb-6 flex items-start gap-3 p-4">
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <AlertDescription>
              Ручные ставки помечаются отдельно. НДС, акциз и дополнительная
              пошлина не рассчитываются без подтверждённых правил и не считаются
              нулевыми.
            </AlertDescription>
          </Alert>

          <CalculationForm onSubmit={onSubmit} />

          <div className="mt-10">
            {isResultStale ? (
              <Card className="border-amber-300 bg-amber-50">
                <CardContent className="flex gap-3 py-5 text-sm text-amber-950">
                  <AlertTriangle
                    aria-hidden="true"
                    className="size-5 shrink-0"
                  />
                  <div>
                    <p className="font-medium">Результат устарел</p>
                    <p className="mt-1 text-amber-900">
                      Данные формы изменились. Нажмите «Рассчитать», чтобы
                      увидеть актуальный результат.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-3"
                      disabled
                    >
                      <Download aria-hidden="true" />
                      Скачать итоговый PDF
                    </Button>
                    <p className="mt-2 text-xs text-amber-900">
                      Экспорт недоступен для устаревшего результата.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : calculation ? (
              <CalculationResults result={calculation.result} />
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-dashed bg-white p-5 text-sm text-zinc-600">
                <CheckCircle2
                  aria-hidden="true"
                  className="size-5 text-zinc-400"
                />
                Заполните обязательные поля и запустите расчёт.
              </div>
            )}
          </div>
        </div>
      </main>
    </FormProvider>
  );
}
