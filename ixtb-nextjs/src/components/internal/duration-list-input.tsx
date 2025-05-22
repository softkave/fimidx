import { Duration } from "date-fns";
import { kDurationUnits } from "fmdx-core/definitions/other";
import { DurationItemInput } from "./duration-item-input";

export function DurationListInput(props: {
  value: Duration;
  onChange: (value: Duration) => void;
  disabled?: boolean;
}) {
  const { value, onChange, disabled } = props;

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <DurationItemInput
          value={{
            unit: kDurationUnits.years,
            duration: value.years ?? 0,
          }}
          onChange={(value) => {
            onChange({
              ...value,
              years: value.duration,
            });
          }}
          unitPlaceholder="Years"
          unitDisabled
          variant="group"
          disabled={disabled}
        />
        <DurationItemInput
          value={{
            unit: kDurationUnits.months,
            duration: value.months ?? 0,
          }}
          onChange={(value) => {
            onChange({
              ...value,
              months: value.duration,
            });
          }}
          unitPlaceholder="Months"
          unitDisabled
          variant="group"
          disabled={disabled}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <DurationItemInput
          value={{
            unit: kDurationUnits.months,
            duration: value.months ?? 0,
          }}
          onChange={(value) => {
            onChange({
              ...value,
              weeks: value.duration,
            });
          }}
          unitPlaceholder="Weeks"
          unitDisabled
          variant="group"
          disabled={disabled}
        />
        <DurationItemInput
          value={{
            unit: kDurationUnits.days,
            duration: value.days ?? 0,
          }}
          onChange={(value) => {
            onChange({
              ...value,
              days: value.duration,
            });
          }}
          unitPlaceholder="Days"
          unitDisabled
          variant="group"
          disabled={disabled}
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <DurationItemInput
          value={{
            unit: kDurationUnits.hours,
            duration: value.hours ?? 0,
          }}
          onChange={(value) => {
            onChange({
              ...value,
              hours: value.duration,
            });
          }}
          unitPlaceholder="Hours"
          unitDisabled
          variant="group"
          disabled={disabled}
        />
        <DurationItemInput
          value={{
            unit: kDurationUnits.minutes,
            duration: value.minutes ?? 0,
          }}
          onChange={(value) => {
            onChange({
              ...value,
              minutes: value.duration,
            });
          }}
          unitPlaceholder="Minutes"
          unitDisabled
          variant="group"
          disabled={disabled}
        />
        <DurationItemInput
          value={{
            unit: kDurationUnits.seconds,
            duration: value.seconds ?? 0,
          }}
          onChange={(value) => {
            onChange({
              ...value,
              seconds: value.duration,
            });
          }}
          unitPlaceholder="Seconds"
          unitDisabled
          variant="group"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
