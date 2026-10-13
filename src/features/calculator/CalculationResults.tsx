import {
  AlertTriangle,
  CheckCircle2,
  Download,
  LoaderCircle,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import type {
  CalculationResult,
  PaymentResult,
  PaymentStatus,
} from "@/types/calculation";
import { formatDate } from "@/utils/formatDate";
import { formatPrice } from "@/utils/formatPrice";

const statusLabels: Record<PaymentStatus, string> = {
  calculated: "Рассчитано",
  zero: "Нулевая ставка",
  "not-applicable": "Не применяется",
  "missing-input": "Нужны данные",
  unsupported: "Нет подтверждённого правила",
};

const statusVariants: Record<
  PaymentStatus,
  "success" | "info" | "muted" | "warning" | "destructive"
> = {
  calculated: "success",
  zero: "info",
  "not-applicable": "muted",
  "missing-input": "warning",
  unsupported: "destructive",
};

const sourceKindLabels: Record<PaymentResult["sourceKind"], string> = {
  manual: "Ручной ввод",
  confirmed: "Подтверждённый источник",
  missing: "Источник отсутствует",
};

const sourceKindVariants: Record<
  PaymentResult["sourceKind"],
  "info" | "success" | "warning"
> = {
  manual: "info",
  confirmed: "success",
  missing: "warning",
};

function PaymentRow({ payment }: { payment: PaymentResult }) {
  return (
    <div className="grid gap-3 border-t px-4 py-4 first:border-t-0 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
      <div>
        <p className="text-sm font-medium text-zinc-950">{payment.label}</p>
        <Badge variant={statusVariants[payment.status]} className="mt-2">
          {statusLabels[payment.status]}
        </Badge>
      </div>
      <div>
        <p className="text-xs text-zinc-500">База</p>
        <p className="mt-1 text-sm font-medium">{formatPrice(payment.base)}</p>
        <p className="mt-0.5 text-xs text-zinc-500">{payment.baseLabel}</p>
      </div>
      <div>
        <p className="text-xs text-zinc-500">Ставка и источник</p>
        <p className="mt-1 text-sm font-medium">{payment.rateLabel}</p>
        <p className="mt-0.5 text-xs text-zinc-500">{payment.source}</p>
        <Badge
          variant={sourceKindVariants[payment.sourceKind]}
          className="mt-2"
        >
          {sourceKindLabels[payment.sourceKind]}
        </Badge>
      </div>
      <div className="lg:text-right">
        <p className="text-xs text-zinc-500">Сумма</p>
        <p className="mt-1 font-mono text-sm font-semibold">
          {payment.amount === null ? "—" : `${formatPrice(payment.amount)} UZS`}
        </p>
        {payment.message ? (
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            {payment.message}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function CalculationResults({ result }: { result: CalculationResult }) {
  const [exportState, setExportState] = useState<
    "idle" | "exporting-final" | "exporting-draft" | "error"
  >("idle");

  const downloadReport = async (kind: "final" | "draft") => {
    if (
      (kind === "final" && (!result.isComplete || result.finalTotal === null)) ||
      (kind === "draft" && result.isComplete)
    ) {
      return;
    }

    setExportState(kind === "final" ? "exporting-final" : "exporting-draft");

    try {
      const report = await import("@/features/report/calculation-report");
      const blob =
        kind === "final"
          ? await report.createCalculationReportBlob(result)
          : await report.createDraftCalculationReportBlob(result);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        kind === "final"
          ? report.getCalculationReportFilename(result)
          : report.getDraftCalculationReportFilename(result);
      link.click();
      URL.revokeObjectURL(url);
      setExportState("idle");
    } catch {
      setExportState("error");
    }
  };

  return (
    <section className="space-y-5" aria-labelledby="results-title">
      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle id="results-title">Результат расчёта</CardTitle>
            <CardDescription className="mt-1">
              Курс: 1 {result.inputCurrency} ={" "}
              {formatPrice(result.exchangeRateToUzs)} UZS, дата курса{" "}
              {formatDate(result.exchangeRateDate)}
            </CardDescription>
          </div>
          {result.isComplete ? (
            <Badge variant="success" className="px-3 py-1.5">
              <CheckCircle2 aria-hidden="true" className="size-3.5" />
              Расчёт полный
            </Badge>
          ) : (
            <Badge variant="warning" className="px-3 py-1.5">
              <AlertTriangle aria-hidden="true" className="size-3.5" />
              Расчёт неполный
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <div className="rounded-xl bg-zinc-950 p-5 text-white">
            <p className="text-xs text-zinc-400">
              {result.isComplete
                ? "Итого по отправке"
                : "Известная промежуточная сумма"}
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold sm:text-3xl">
              {formatPrice(result.finalTotal ?? result.knownSubtotal)} UZS
            </p>
            {!result.isComplete ? (
              <p className="mt-3 max-w-2xl text-xs leading-5 text-zinc-400">
                Это не итоговая сумма: для НДС, акциза и дополнительной пошлины
                нет подтверждённых ставок и формул базы.
              </p>
            ) : null}
            <div className="mt-5 flex flex-col items-start gap-2 sm:flex-row sm:items-center">
              {result.isComplete ? (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={
                    result.finalTotal === null || exportState === "exporting-final"
                  }
                  onClick={() => downloadReport("final")}
                >
                  {exportState === "exporting-final" ? (
                    <LoaderCircle aria-hidden="true" className="animate-spin" />
                  ) : (
                    <Download aria-hidden="true" />
                  )}
                  Скачать итоговый PDF
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={exportState === "exporting-draft"}
                  onClick={() => downloadReport("draft")}
                >
                  {exportState === "exporting-draft" ? (
                    <LoaderCircle aria-hidden="true" className="animate-spin" />
                  ) : (
                    <Download aria-hidden="true" />
                  )}
                  Скачать черновой PDF
                </Button>
              )}
              <p className="text-xs text-zinc-400">
                {result.isComplete
                  ? "PDF формируется из показанного результата без повторного расчёта."
                  : "Черновик содержит только известные суммы и не является итоговым таможенным расчётом."}
              </p>
            </div>
            {exportState === "error" ? (
              <p className="mt-2 text-xs text-red-300" role="alert">
                Не удалось сформировать PDF. Попробуйте ещё раз.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {result.items.map((item, index) => (
        <Card key={item.lineId}>
          <CardHeader>
            <CardTitle className="text-base">
              Товар {index + 1}: {item.hsCode}
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {item.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <div className="border-y">
              {item.payments.map((payment) => (
                <PaymentRow key={payment.type} payment={payment} />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Платежи по отправке</CardTitle>
          <CardDescription>
            Сбор за оформление применяется здесь один раз, а не для каждого
            товара.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <div className="border-y">
            {result.shipmentPayments.map((payment) => (
              <PaymentRow key={payment.type} payment={payment} />
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
