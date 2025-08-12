import { cn } from "@/src/lib/utils";
import {
  DurationUnit,
  kDurationUnits,
  kDurationUnitsToLabel,
} from "fimidx-core/definitions/other";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export interface IDurationItemValue {
  duration: number;
  unit: DurationUnit;
}

export function DurationItemInput(props: {
  value: IDurationItemValue;
  onChange: (value: IDurationItemValue) => void;
  durationPlaceholder?: string;
  unitPlaceholder?: string;
  allowedUnits?: DurationUnit[];
  variant?: "single" | "group";
  disabled?: boolean;
  unitDisabled?: boolean;
  durationDisabled?: boolean;
}) {
  const {
    value,
    onChange,
    durationPlaceholder,
    unitPlaceholder,
    allowedUnits = Object.values(kDurationUnits),
    variant = "single",
    disabled,
    unitDisabled,
    durationDisabled,
  } = props;

  return (
    <div className={cn("grid grid-cols-2", variant === "single" && "gap-2")}>
      <Select disabled={disabled || unitDisabled}>
        <SelectTrigger
          className={cn("w-full", variant === "group" && "rounded-r-none")}
        >
          <SelectValue placeholder={unitPlaceholder ?? "Select a duration"} />
        </SelectTrigger>
        <SelectContent>
          {allowedUnits.map((unit) => (
            <SelectItem key={unit} value={unit}>
              {kDurationUnitsToLabel[unit]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="number"
        value={value.duration}
        onChange={(e) =>
          onChange({
            duration: Number(e.target.value),
            unit: value.unit,
          })
        }
        placeholder={durationPlaceholder ?? "Enter a duration"}
        className={cn(
          "w-full text-right",
          variant === "group" && "rounded-l-none border-l-0"
        )}
        disabled={disabled || durationDisabled}
        min={0}
      />
    </div>
  );
}
