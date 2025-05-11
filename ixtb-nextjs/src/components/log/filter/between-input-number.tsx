import { Input } from "../../ui/input";

export function BetweenInputNumber(props: {
  value: string[];
  onChange: (value: string[]) => void;
  fieldName: string;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-[1fr_1fr] gap-2 w-full">
      <Input
        type="number"
        placeholder="From"
        value={props.value[0]}
        onChange={(e) => props.onChange([e.target.value, props.value[1]])}
        disabled={props.disabled}
      />
      <Input
        type="number"
        placeholder="To"
        value={props.value[1]}
        onChange={(e) => props.onChange([props.value[0], e.target.value])}
        disabled={props.disabled}
      />
    </div>
  );
}
