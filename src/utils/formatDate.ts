import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

const inputDateFormat = "DD-MM-YYYY";
const storedDateFormat = "YYYY-MM-DD";

export const formatDate = (value: string) => {
  const date = dayjs(value, storedDateFormat, true);
  return date.isValid() ? date.format(inputDateFormat) : value;
};

export const normalizeDate = (value: string) => {
  const date = dayjs(value, inputDateFormat, true);
  return date.isValid() ? date.format(storedDateFormat) : value;
};

export const parseDate = (value: string) => {
  const normalized = normalizeDate(value);
  const date = dayjs(normalized, storedDateFormat, true);

  return date.isValid() ? date.toDate() : undefined;
};

export const toStoredDate = (value: Date) =>
  dayjs(value).format(storedDateFormat);
