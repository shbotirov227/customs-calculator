import { useDeferredValue, useId, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LoaderCircle, Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  productCatalogSearchQueryOptions,
  type ProductCatalogItem,
} from '@/lib/product-catalog'

interface CatalogSearchProps {
  onSelect: (item: ProductCatalogItem) => void
}

export function CatalogSearch({ onSelect }: CatalogSearchProps) {
  const inputId = useId()
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const deferredSearch = useDeferredValue(search)
  const query = useQuery(productCatalogSearchQueryOptions(deferredSearch, 12))
  const canSearch = search.replace(/\s+/gu, '').length >= 2

  return (
    <div className="relative">
      <Label htmlFor={inputId}>Поиск по каталогу</Label>
      <div className="relative mt-1.5">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400"
        />
        <Input
          id={inputId}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Код ТН ВЭД или описание"
          className="pl-9"
          autoComplete="off"
        />
        {query.isFetching ? (
          <LoaderCircle
            aria-label="Загрузка каталога"
            className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-zinc-500"
          />
        ) : null}
      </div>

      {isOpen && canSearch ? (
        <div className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border bg-white p-1.5 shadow-xl">
          {query.isError ? (
            <p className="px-3 py-4 text-sm text-red-700">
              Каталог не загрузился. Код можно ввести вручную.
            </p>
          ) : null}
          {query.isSuccess && query.data.length === 0 ? (
            <p className="px-3 py-4 text-sm text-zinc-500">
              Совпадений нет. Проверьте запрос или заполните товар вручную.
            </p>
          ) : null}
          {query.data?.map((item) => (
            <button
              key={item.code}
              type="button"
              className="w-full rounded-lg px-3 py-2.5 text-left hover:bg-zinc-100 focus-visible:bg-zinc-100 focus-visible:outline-none"
              onClick={() => {
                onSelect(item)
                setSearch(`${item.code} — ${item.description}`)
                setIsOpen(false)
              }}
            >
              <span className="block font-mono text-xs font-semibold text-zinc-950">
                {item.code}
              </span>
              <span className="mt-1 line-clamp-2 block text-xs leading-5 text-zinc-600">
                {item.description}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
