import { Input } from "@/src/components/ui/input";
import { cn } from "@/src/lib/utils";

export function TimePicker(props: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}) {
  const { value, onChange, className, disabled } = props;

  const [hours, minutes, seconds] = value.split(":");

  return (
    <div className={cn("grid grid-cols-[1fr_1fr_1fr] gap-2", className)}>
      <Input
        type="number"
        value={hours}
        min={0}
        max={23}
        disabled={disabled}
        onChange={(e) => {
          const value = e.target.value;
          if (value === "") {
            onChange(`00:${minutes}:${seconds}`);
          } else {
            let parsedValue = parseInt(value);
            if (isNaN(parsedValue)) {
              return;
            } else if (parsedValue < 0) {
              parsedValue = 0;
            } else if (parsedValue > 23) {
              parsedValue = 23;
            }

            onChange(`${parsedValue}:${minutes}:${seconds}`);
          }
        }}
        placeholder="HH"
      />
      <Input
        type="number"
        value={minutes}
        min={0}
        max={59}
        disabled={disabled}
        onChange={(e) => {
          const value = e.target.value;
          if (value === "") {
            onChange(`${hours}:00:${seconds}`);
          } else {
            let parsedValue = parseInt(value);
            if (isNaN(parsedValue)) {
              return;
            } else if (parsedValue < 0) {
              parsedValue = 0;
            } else if (parsedValue > 59) {
              parsedValue = 59;
            }

            onChange(`${hours}:${parsedValue}:${seconds}`);
          }
        }}
        placeholder="MM"
      />
      <Input
        type="number"
        value={seconds}
        min={0}
        max={59}
        disabled={disabled}
        onChange={(e) => {
          const value = e.target.value;
          if (value === "") {
            onChange(`${hours}:${minutes}:00`);
          } else {
            let parsedValue = parseInt(value);
            if (isNaN(parsedValue)) {
              return;
            } else if (parsedValue < 0) {
              parsedValue = 0;
            } else if (parsedValue > 59) {
              parsedValue = 59;
            }

            onChange(`${hours}:${minutes}:${parsedValue}`);
          }
        }}
        placeholder="SS"
      />
    </div>
  );
}
