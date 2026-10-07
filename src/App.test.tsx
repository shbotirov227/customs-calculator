import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import App from '@/App'

afterEach(cleanup)

const renderApp = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  )
}

describe('calculator page', () => {
  const syntheticGtdXml = `<?xml version="1.0"?>
    <GTD_eCopy_DefEdFormat><T1>
      <T2><P4T2>Синтетический импорт А</P4T2><P9T2>0123456789</P9T2></T2>
      <T2><P4T2>Синтетический импорт Б</P4T2><P9T2>0123456789</P9T2></T2>
    </T1></GTD_eCopy_DefEdFormat>`

  it('calculates a manual duty and marks changed results as stale', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.type(screen.getByLabelText('Код ТН ВЭД'), '0123456789')
    await user.type(
      screen.getByLabelText('Описание'),
      'Синтетический тестовый товар',
    )
    await user.type(screen.getByLabelText('Таможенная стоимость'), '100')
    await user.selectOptions(
      screen.getByLabelText('Тип ставки пошлины'),
      'ad-valorem',
    )
    await user.type(screen.getByLabelText('Ставка, %'), '10')
    await user.click(screen.getByRole('button', { name: 'Рассчитать' }))

    expect(await screen.findByText('Результат расчёта')).toBeInTheDocument()
    expect(screen.getAllByText('10,00 UZS')).not.toHaveLength(0)
    expect(screen.getByText('Расчёт неполный')).toBeInTheDocument()
    expect(screen.getByText('Ручной ввод')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Скачать итоговый PDF' }),
    ).toBeDisabled()
    expect(
      screen.getByText(/Экспорт недоступен: сначала нужны/u),
    ).toBeInTheDocument()

    await user.type(screen.getByLabelText('Таможенная стоимость'), '0')

    expect(screen.getByText('Результат устарел')).toBeInTheDocument()
    expect(screen.queryByText('Результат расчёта')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Скачать итоговый PDF' }),
    ).toBeDisabled()
    expect(
      screen.getByText('Экспорт недоступен для устаревшего результата.'),
    ).toBeInTheDocument()
  })

  it('adds, copies and removes product rows with stable field-array actions', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('button', { name: 'Добавить товар' }))
    expect(screen.getByText('Товар 2')).toBeInTheDocument()

    const descriptions = screen.getAllByLabelText('Описание')
    await user.type(descriptions[0], 'Первый синтетический товар')
    await user.type(descriptions[1], 'Второй синтетический товар')

    await user.click(screen.getByRole('button', { name: 'Копировать товар 1' }))
    expect(screen.getByText('Товар 3')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Удалить товар 2' }))
    expect(screen.queryByText('Товар 3')).not.toBeInTheDocument()
    expect(screen.getByText('Товар 2')).toBeInTheDocument()

    const remainingDescriptions = screen.getAllByLabelText('Описание')
    expect(remainingDescriptions[0]).toHaveValue('Первый синтетический товар')
    expect(remainingDescriptions[1]).toHaveValue('Первый синтетический товар')
  })

  it('shows validation errors and does not calculate empty required inputs', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('button', { name: 'Рассчитать' }))

    expect(
      await screen.findByText('Код ТН ВЭД должен содержать 10 цифр'),
    ).toBeInTheDocument()
    expect(screen.getByText('Укажите описание товара')).toBeInTheDocument()
    expect(
      screen.getByText('Таможенная стоимость: укажите значение'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Результат расчёта')).not.toBeInTheDocument()
  })

  it('does not replace a missing duty rate with zero', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.type(screen.getByLabelText('Код ТН ВЭД'), '0123456789')
    await user.type(
      screen.getByLabelText('Описание'),
      'Синтетический товар без ставки',
    )
    await user.type(screen.getByLabelText('Таможенная стоимость'), '100')
    await user.click(screen.getByRole('button', { name: 'Рассчитать' }))

    expect(await screen.findByText('Результат расчёта')).toBeInTheDocument()
    expect(screen.getByText('Расчёт неполный')).toBeInTheDocument()
    expect(screen.getAllByText('Нужны данные').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Источник отсутствует').length).toBeGreaterThan(
      0,
    )
    expect(
      screen.getByRole('button', { name: 'Скачать итоговый PDF' }),
    ).toBeDisabled()
    expect(screen.queryByText('Итого')).not.toBeInTheDocument()
  })

  it('does not offer an unconfirmed MAX or SUM formula', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.selectOptions(
      screen.getByLabelText('Тип ставки пошлины'),
      'combined',
    )

    expect(
      screen.getByText(/MAX или SUM не подтверждены источниками/u),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('option', { name: /MAX/u }),
    ).not.toBeInTheDocument()
  })

  it('previews XML and leaves the current form unchanged when cancelled', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.type(
      screen.getByLabelText('Описание'),
      'Текущий синтетический товар',
    )
    await user.upload(
      screen.getByLabelText('Файл XML'),
      new File([syntheticGtdXml], 'synthetic-gtd.xml', {
        type: 'application/xml',
      }),
    )

    expect(
      await screen.findByRole('dialog', {
        name: 'Предпросмотр импорта GTD XML',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('Синтетический импорт А')).toBeInTheDocument()
    expect(
      screen.getByText(/Валюта и курс не сопоставлены/u),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Описание')).toHaveValue(
      'Текущий синтетический товар',
    )

    await user.click(screen.getByRole('button', { name: 'Отменить' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Описание')).toHaveValue(
      'Текущий синтетический товар',
    )
  })

  it('imports confirmed XML fields without merging duplicate HS positions', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.selectOptions(screen.getByLabelText('Валюта стоимости'), 'USD')
    await user.upload(
      screen.getByLabelText('Файл XML'),
      new File([syntheticGtdXml], 'synthetic-gtd.xml', {
        type: 'application/xml',
      }),
    )
    await user.click(
      await screen.findByRole('button', { name: 'Импортировать товары' }),
    )

    const codes = screen.getAllByLabelText('Код ТН ВЭД')
    const descriptions = screen.getAllByLabelText('Описание')
    const quantities = screen.getAllByLabelText('Количество')
    const customsValues = screen.getAllByLabelText('Таможенная стоимость')

    expect(codes).toHaveLength(2)
    expect(codes[0]).toHaveValue('0123456789')
    expect(codes[1]).toHaveValue('0123456789')
    expect(descriptions[0]).toHaveValue('Синтетический импорт А')
    expect(descriptions[1]).toHaveValue('Синтетический импорт Б')
    expect(quantities[0]).toHaveValue('')
    expect(customsValues[0]).toHaveValue('')
    expect(screen.getByLabelText('Валюта стоимости')).toHaveValue('USD')
  })
})
