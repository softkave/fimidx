import { cn } from "@/src/lib/utils";
import { XIcon } from "lucide-react";
import { useState } from "react";
import { Input } from "../../ui/input";

export function InInput(props: {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}) {
  const { value, onChange, disabled } = props;

  const [inputValue, setInputValue] = useState<string>("");

  const inputNode = (
    <Input
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          if (disabled) {
            return;
          }

          if (inputValue) {
            onChange([...value, inputValue]);
            setInputValue("");
          }
        }
      }}
      disabled={disabled}
    />
  );

  const selectedNode = (
    <div className="flex flex-col gap-2">
      {value.map((option) => (
        <div
          key={option}
          className="max-w-[200px] truncate grid grid-cols-[1fr_auto] gap-2"
        >
          <span className="truncate">{option}</span>
          <XIcon
            className={cn("w-4 h-4 cursor-pointer", disabled && "opacity-50")}
            onClick={() => {
              if (disabled) {
                return;
              }

              onChange(value.filter((o) => o !== option));
            }}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-2">
      {inputNode}
      {selectedNode}
    </div>
  );
}
