import { cn } from "@/src/lib/utils";
import { format, parse } from "date-fns";
import { DurationUnit } from "fmdx-core/definitions/other";
import { isNumber } from "lodash-es";
import { CalendarIcon, CalendarRangeIcon, HashIcon } from "lucide-react";
import { useState } from "react";
import { DurationItemInput } from "../../internal/duration-item-input";
import { Button } from "../../ui/button";
import { Calendar } from "../../ui/calendar";
import { Input } from "../../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { ToggleGroup, ToggleGroupItem } from "../../ui/toggle-group";
import { TimePicker } from "./time-picker";

export function NumberOrDateInput(props: {
  value: string[];
  onChange: (value: string[]) => void;
  fieldName: string;
  disabled?: boolean;
}) {
  const { value, onChange, disabled } = props;
  const [type, setType] = useState<"date" | "number" | "duration">("number");
  const valueNumber = isNumber(Number(value[0])) ? Number(value[0]) : undefined;
  const valueDate = value[0] ? new Date(Number(value[0])) : undefined;

  return (
    <div className="grid grid-cols-[auto_1fr] gap-2 w-full">
      <ToggleGroup
        type="single"
        onValueChange={(value) => {
          setType(value as "date" | "number");
          onChange([]);
        }}
        variant="outline"
        value={type}
        disabled={disabled}
      >
        <ToggleGroupItem value="number" aria-label="Toggle number">
          <HashIcon className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="date" aria-label="Toggle date">
          <CalendarIcon className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="duration" aria-label="Toggle duration">
          <CalendarRangeIcon className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
      {type === "number" ? (
        <Input
          type="number"
          value={valueNumber}
          onChange={(e) => onChange([e.target.value])}
          className="w-full"
          placeholder="Number"
          disabled={disabled}
        />
      ) : type === "date" ? (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !valueDate && "text-muted-foreground"
              )}
              disabled={disabled}
            >
              <CalendarIcon />
              {valueDate ? (
                format(valueDate, "PPP HH:mm:ss")
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-4">
              <TimePicker
                value={valueDate ? format(valueDate, "HH:mm:ss") : ""}
                onChange={(value) => {
                  const intermediateValue = parse(
                    value,
                    "HH:mm:ss",
                    valueDate ?? new Date()
                  );

                  onChange([intermediateValue.getTime().toString()]);
                }}
                disabled={!valueDate || disabled}
              />
            </div>
            <Calendar
              mode="single"
              selected={valueDate}
              onSelect={(date) => {
                onChange([date?.getTime().toString() ?? ""]);
              }}
              initialFocus
              disabled={disabled}
            />
          </PopoverContent>
        </Popover>
      ) : type === "duration" ? (
        <DurationItemInput
          value={{
            duration: Number(value[0] || 0),
            unit: (value[1] ?? "seconds") as DurationUnit,
          }}
          onChange={(value) => {
            onChange([value.duration.toString(), value.unit]);
          }}
          disabled={disabled}
        />
      ) : null}
    </div>
  );
}
