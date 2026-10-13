import dayjs from "dayjs";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const monthNames = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

const weekdayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

interface CalendarProps {
  month: Date;
  selected?: Date;
  onMonthChange: (month: Date) => void;
  onSelect: (date: Date) => void;
}

function Calendar({ month, selected, onMonthChange, onSelect }: CalendarProps) {
  const displayedMonth = dayjs(month).startOf("month");
  const selectedDay = selected ? dayjs(selected) : undefined;
  const startOffset = (displayedMonth.day() + 6) % 7;
  const daysInMonth = displayedMonth.daysInMonth();
  const cells = Array.from({ length: Math.ceil((startOffset + daysInMonth) / 7) * 7 });

  return (
    <div className="w-72 p-3" role="dialog" aria-label="Календарь">
      <div className="mb-3 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Предыдущий месяц"
          onClick={() => onMonthChange(displayedMonth.subtract(1, "month").toDate())}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <p className="text-sm font-medium">
          {monthNames[displayedMonth.month()]} {displayedMonth.year()}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Следующий месяц"
          onClick={() => onMonthChange(displayedMonth.add(1, "month").toDate())}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {weekdayNames.map((day) => (
          <span key={day} className="h-8 text-xs leading-8 text-muted-foreground">
            {day}
          </span>
        ))}
        {cells.map((_, index) => {
          const dayNumber = index - startOffset + 1;
          if (dayNumber < 1 || dayNumber > daysInMonth) {
            return <span key={index} className="size-8" aria-hidden="true" />;
          }

          const date = displayedMonth.date(dayNumber);
          const isSelected = selectedDay?.isSame(date, "day") ?? false;
          const isToday = dayjs().isSame(date, "day");
          const label = `${dayNumber} ${monthNames[date.month()].toLowerCase()} ${date.year()}`;

          return (
            <Button
              key={date.format("YYYY-MM-DD")}
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={label}
              aria-pressed={isSelected}
              className={cn(
                "size-8 rounded-md font-normal",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
                !isSelected && isToday && "bg-muted font-medium",
              )}
              onClick={() => onSelect(date.toDate())}
            >
              {dayNumber}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export { Calendar };
