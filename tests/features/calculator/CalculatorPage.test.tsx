import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import App from "@/App";

afterEach(cleanup);

const renderApp = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
};

describe("calculator page", () => {
  const syntheticGtdXml = `<?xml version="1.0"?>
    <GTD_eCopy_DefEdFormat><T1>
      <T2><P4T2>Синтетический импорт А</P4T2><P9T2>0123456789</P9T2></T2>
      <T2><P4T2>Синтетический импорт Б</P4T2><P9T2>0123456789</P9T2></T2>
    </T1></GTD_eCopy_DefEdFormat>`;

  it("formats monetary inputs with grouped digits and a comma separator", async () => {
    const user = userEvent.setup();
    renderApp();

    const exchangeRate = screen.getByLabelText("Курс к UZS");
    await user.clear(exchangeRate);
    await user.type(exchangeRate, "1400000.25");
    expect(exchangeRate).toHaveValue("1 400 000,25");

    const customsValue = screen.getByLabelText("Таможенная стоимость");
    await user.type(customsValue, "100000000.000");
    expect(customsValue).toHaveValue("100 000 000,000");
  });

  it("synchronizes typed dates and calendar selections", async () => {
    const user = userEvent.setup();
    renderApp();

    const dateInput = screen.getByLabelText("Дата расчёта");
    await user.clear(dateInput);
    await user.type(dateInput, "25-12-2026");
    await user.click(
      screen.getByRole("button", { name: "Дата расчёта: открыть календарь" }),
    );

    expect(screen.getByText(/декабрь 2026/iu)).toBeInTheDocument();
    const decemberDay = screen.getByRole("button", {
      name: /25 декабр.* 2026/iu,
    });
    expect(decemberDay).toHaveAttribute("aria-pressed", "true");
    await user.click(decemberDay);
    expect(dateInput).toHaveValue("25-12-2026");

    await user.clear(dateInput);
    await user.type(dateInput, "14-02-2027");
    await user.click(
      screen.getByRole("button", { name: "Дата расчёта: открыть календарь" }),
    );
    expect(screen.getByText(/февраль 2027/iu)).toBeInTheDocument();
    const februaryDay = screen.getByRole("button", {
      name: /14 феврал.* 2027/iu,
    });
    expect(februaryDay).toHaveAttribute("aria-pressed", "true");

    await user.click(
      screen.getByRole("button", { name: /18 феврал.* 2027/iu }),
    );
    expect(dateInput).toHaveValue("18-02-2027");

    await user.clear(dateInput);
    await user.type(dateInput, "21-03-2027");
    await user.click(
      screen.getByRole("button", { name: "Дата расчёта: открыть календарь" }),
    );
    expect(screen.getByText(/март 2027/iu)).toBeInTheDocument();
    const marchDay = screen.getByRole("button", {
      name: /21 март.* 2027/iu,
    });
    expect(marchDay).toHaveAttribute("aria-pressed", "true");
  });

  it("calculates a manual duty and marks changed results as stale", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.type(screen.getByLabelText("Код ТН ВЭД"), "0123456789");
    await user.type(
      screen.getByLabelText("Описание"),
      "Синтетический тестовый товар",
    );
    await user.type(screen.getByLabelText("Таможенная стоимость"), "100");
    await user.click(
      screen.getByRole("combobox", { name: "Тип ставки пошлины" }),
    );
    await user.click(
      await screen.findByRole("option", { name: "Процент от стоимости" }),
    );
    await user.type(screen.getByLabelText("Ставка, %"), "10");
    await user.click(screen.getByRole("button", { name: "Рассчитать" }));

    expect(await screen.findByText("Результат расчёта")).toBeInTheDocument();
    expect(screen.getAllByText("10,00 UZS")).not.toHaveLength(0);
    expect(screen.getByText("Расчёт неполный")).toBeInTheDocument();
    expect(screen.getByText("Ручной ввод")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Скачать черновой PDF" }),
    ).toBeEnabled();
    expect(
      screen.getByText(/Черновик содержит только известные суммы/u),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText("Таможенная стоимость"), "0");

    expect(screen.getByText("Результат устарел")).toBeInTheDocument();
    expect(screen.queryByText("Результат расчёта")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Скачать итоговый PDF" }),
    ).toBeDisabled();
    expect(
      screen.getByText("Экспорт недоступен для устаревшего результата."),
    ).toBeInTheDocument();
  }, 15000);

  it("adds, copies and removes product rows with stable field-array actions", async () => {
    const user = userEvent.setup();
    renderApp();

    const productTable = screen.getByRole("table", {
      name: "Товары и параметры ручного расчёта пошлины",
    });
    expect(productTable).toBeInTheDocument();
    expect(productTable.closest('[data-slot="card"]')).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Добавить товар" }));
    expect(screen.getByText("Товар 2")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(3);

    const descriptions = screen.getAllByLabelText("Описание");
    await user.type(descriptions[0], "Первый синтетический товар");
    await user.type(descriptions[1], "Второй синтетический товар");

    await user.click(
      screen.getByRole("button", { name: "Копировать товар 1" }),
    );
    expect(screen.getByText("Товар 3")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(4);

    await user.click(screen.getByRole("button", { name: "Удалить товар 2" }));
    expect(screen.queryByText("Товар 3")).not.toBeInTheDocument();
    expect(screen.getByText("Товар 2")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(3);

    const remainingDescriptions = screen.getAllByLabelText("Описание");
    expect(remainingDescriptions[0]).toHaveValue("Первый синтетический товар");
    expect(remainingDescriptions[1]).toHaveValue("Первый синтетический товар");
  }, 15000);

  it("shows validation errors and does not calculate empty required inputs", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: "Рассчитать" }));

    expect(
      await screen.findByText("Код ТН ВЭД должен содержать 10 цифр"),
    ).toBeInTheDocument();
    expect(screen.getByText("Укажите описание товара")).toBeInTheDocument();
    expect(
      screen.getByText("Таможенная стоимость: укажите значение"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Результат расчёта")).not.toBeInTheDocument();

    const hsCodeInput = screen.getAllByLabelText("Код ТН ВЭД")[0];
    expect(hsCodeInput).toHaveAttribute("aria-invalid", "true");
    const hsCodeErrorId = hsCodeInput.getAttribute("aria-describedby");
    expect(hsCodeErrorId).toBeTruthy();
    expect(document.getElementById(hsCodeErrorId!)).toHaveAttribute(
      "role",
      "alert",
    );

    await user.type(hsCodeInput, "0123456789");
    expect(hsCodeInput).not.toHaveAttribute("aria-invalid", "true");
    expect(
      screen.queryByText("Код ТН ВЭД должен содержать 10 цифр"),
    ).not.toBeInTheDocument();
  });

  it("does not replace a missing duty rate with zero", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.type(screen.getByLabelText("Код ТН ВЭД"), "0123456789");
    await user.type(
      screen.getByLabelText("Описание"),
      "Синтетический товар без ставки",
    );
    await user.type(screen.getByLabelText("Таможенная стоимость"), "100");
    await user.click(screen.getByRole("button", { name: "Рассчитать" }));

    expect(await screen.findByText("Результат расчёта")).toBeInTheDocument();
    expect(screen.getByText("Расчёт неполный")).toBeInTheDocument();
    expect(screen.getAllByText("Нужны данные").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Источник отсутствует").length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getByRole("button", { name: "Скачать черновой PDF" }),
    ).toBeEnabled();
    expect(screen.queryByText("Итого")).not.toBeInTheDocument();
  });

  it("does not offer an unconfirmed MAX or SUM formula", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(
      screen.getByRole("combobox", { name: "Тип ставки пошлины" }),
    );
    await user.click(
      await screen.findByRole("option", { name: "Комбинированная" }),
    );

    expect(
      screen.getByText(/MAX или SUM не подтверждены источниками/u),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: /MAX/u }),
    ).not.toBeInTheDocument();
  });

  it("previews XML and leaves the current form unchanged when cancelled", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.type(
      screen.getByLabelText("Описание"),
      "Текущий синтетический товар",
    );
    await user.upload(
      screen.getByLabelText("Файл XML"),
      new File([syntheticGtdXml], "synthetic-gtd.xml", {
        type: "application/xml",
      }),
    );

    expect(
      await screen.findByRole("dialog", {
        name: "Предпросмотр импорта GTD XML",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Синтетический импорт А")).toBeInTheDocument();
    expect(
      screen.getByText(/Валюта и курс не сопоставлены/u),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Описание")).toHaveValue(
      "Текущий синтетический товар",
    );

    await user.click(screen.getByRole("button", { name: "Отменить" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Описание")).toHaveValue(
      "Текущий синтетический товар",
    );
  });

  it("keeps the selected XML filename visible when rejecting a non-GTD document", async () => {
    const user = userEvent.setup();
    renderApp();

    const input = screen.getByLabelText("Файл XML");
    const file = new File(
      ["<!DOCTYPE html><html><body>synthetic sample</body></html>"],
      "synthetic-html.xml",
      { type: "application/xml" },
    );

    await user.upload(input, file);

    expect((input as HTMLInputElement).files?.[0]?.name).toBe(file.name);
    expect(await screen.findByText(/DOCTYPE/u)).toBeInTheDocument();
  });

  it("imports confirmed XML fields without merging duplicate HS positions", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(
      screen.getByRole("combobox", { name: "Валюта стоимости" }),
    );
    await user.click(await screen.findByRole("option", { name: "USD" }));
    await user.upload(
      screen.getByLabelText("Файл XML"),
      new File([syntheticGtdXml], "synthetic-gtd.xml", {
        type: "application/xml",
      }),
    );
    await user.click(
      await screen.findByRole("button", { name: "Импортировать товары" }),
    );

    const codes = screen.getAllByLabelText("Код ТН ВЭД");
    const descriptions = screen.getAllByLabelText("Описание");
    const quantities = screen.getAllByLabelText("Количество");
    const customsValues = screen.getAllByLabelText("Таможенная стоимость");

    expect(codes).toHaveLength(2);
    expect(codes[0]).toHaveValue("0123456789");
    expect(codes[1]).toHaveValue("0123456789");
    expect(descriptions[0]).toHaveValue("Синтетический импорт А");
    expect(descriptions[1]).toHaveValue("Синтетический импорт Б");
    expect(quantities[0]).toHaveValue("");
    expect(customsValues[0]).toHaveValue("");
    expect(
      screen.getByRole("combobox", { name: "Валюта стоимости" }),
    ).toHaveTextContent("USD");
  });
});
