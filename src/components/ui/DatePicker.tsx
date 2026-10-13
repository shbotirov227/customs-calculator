import { CalendarDays } from "lucide-react";
import { useState, type Ref } from "react";
import { Popover as PopoverPrimitive } from "radix-ui";

import { Button } from "@/components/ui/Button";
import { Calendar } from "@/components/ui/Calendar";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/InputGroup";
import { formatDate, parseDate, toStoredDate } from "@/utils/formatDate";

interface DatePickerProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  inputRef?: Ref<HTMLInputElement>;
  placeholder?: string;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

function DatePicker({
  id,
  label,
  value,
  onChange,
  onBlur,
  inputRef,
  placeholder = "DD-MM-YYYY",
  className,
  ...accessibilityProps
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseDate(value);
  const [month, setMonth] = useState(selectedDate ?? new Date());

  const setOpenAndMonth = (nextOpen: boolean) => {
    if (nextOpen) setMonth(parseDate(value) ?? new Date());
    setOpen(nextOpen);
  };

  const handleInputChange = (nextValue: string) => {
    onChange(nextValue);

    const typedDate = parseDate(nextValue);
    if (typedDate) setMonth(typedDate);
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpenAndMonth}>
      <InputGroup className={`mt-1.5 ${className ?? ""}`}>
        <InputGroupInput
          id={id}
          type="text"
          inputMode="text"
          placeholder={placeholder}
          value={formatDate(value)}
          onChange={(event) => handleInputChange(event.target.value)}
          onBlur={onBlur}
          ref={inputRef}
          {...accessibilityProps}
        />
        <InputGroupAddon align="inline-end">
          <PopoverPrimitive.Trigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={`${label}: открыть календарь`}
              aria-expanded={open}
            >
              <CalendarDays aria-hidden="true" className="size-4" />
            </Button>
          </PopoverPrimitive.Trigger>
        </InputGroupAddon>
      </InputGroup>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={4}
          className="z-50 w-auto rounded-md border bg-popover p-0 text-popover-foreground shadow-md outline-none"
        >
          <Calendar
            selected={selectedDate}
            month={month}
            onMonthChange={setMonth}
            onSelect={(date) => {
              onChange(toStoredDate(date));
              setOpen(false);
            }}
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export { DatePicker };
