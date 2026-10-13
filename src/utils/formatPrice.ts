const groupThousands = (value: string) =>
  value.replace(/\B(?=(\d{3})+(?!\d))/gu, " ");

export const normalizePriceInput = (value: string) => {
  const compact = value.replace(/\s/gu, "").replace(/[^\d.,]/gu, "");
  const separatorIndex = compact.search(/[.,]/u);

  if (separatorIndex < 0) return compact;

  const integer = compact.slice(0, separatorIndex).replace(/[.,]/gu, "");
  const fraction = compact.slice(separatorIndex + 1).replace(/[.,]/gu, "");
  return `${integer},${fraction}`;
};

export const formatPrice = (
  value: string | null | undefined,
  emptyValue = "—",
) => {
  if (value == null) return emptyValue;
  if (value.trim() === "") return "";

  const normalized = normalizePriceInput(value);
  const separatorIndex = normalized.indexOf(",");
  const integer =
    separatorIndex < 0 ? normalized : normalized.slice(0, separatorIndex);
  const fraction =
    separatorIndex < 0 ? "" : normalized.slice(separatorIndex + 1);
  const groupedInteger = groupThousands(integer || "0");

  return separatorIndex < 0 ? groupedInteger : `${groupedInteger},${fraction}`;
};
