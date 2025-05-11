import { kMonitorStatus, MonitorStatus } from "@/src/definitions/monitor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@radix-ui/react-select";
import { FormControl } from "../ui/form";

export const kMonitorStatusLabels = {
  [kMonitorStatus.enabled]: "Enabled",
  [kMonitorStatus.disabled]: "Disabled",
} as const;

export function MonitorStatusSelectInput(props: {
  status: MonitorStatus;
  onChange: (status: MonitorStatus) => void;
  isForm?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const selectTriggerNode = (
    <SelectTrigger className={props.className}>
      <SelectValue placeholder="Select a status" />
    </SelectTrigger>
  );

  return (
    <Select
      value={props.status}
      onValueChange={props.onChange}
      disabled={props.disabled}
    >
      {props.isForm ? (
        <FormControl>{selectTriggerNode}</FormControl>
      ) : (
        selectTriggerNode
      )}
      <SelectContent>
        <SelectItem value={kMonitorStatus.enabled}>
          {kMonitorStatusLabels[kMonitorStatus.enabled]}
        </SelectItem>
        <SelectItem value={kMonitorStatus.disabled}>
          {kMonitorStatusLabels[kMonitorStatus.disabled]}
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
