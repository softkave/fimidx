import {
  kDurationUnits,
  kDurationUnitsToMs,
  type Duration,
} from "../definitions/other.js";

export function formatDate(date: Date | string | number) {
  return new Date(date).toLocaleString();
}

export function isDuration(value: unknown): value is Duration {
  return (
    typeof value === "object" &&
    value !== null &&
    ("years" in value ||
      "months" in value ||
      "weeks" in value ||
      "days" in value ||
      "hours" in value ||
      "minutes" in value ||
      "seconds" in value ||
      "milliseconds" in value)
  );
}

export function getMsFromDuration(duration: Duration) {
  const { years, months, weeks, days, hours, minutes, seconds, milliseconds } =
    duration;

  let durationMs = 0;

  if (years) {
    durationMs += years * kDurationUnitsToMs[kDurationUnits.years];
  }
  if (months) {
    durationMs += months * kDurationUnitsToMs[kDurationUnits.months];
  }
  if (weeks) {
    durationMs += weeks * kDurationUnitsToMs[kDurationUnits.weeks];
  }
  if (days) {
    durationMs += days * kDurationUnitsToMs[kDurationUnits.days];
  }
  if (hours) {
    durationMs += hours * kDurationUnitsToMs[kDurationUnits.hours];
  }
  if (minutes) {
    durationMs += minutes * kDurationUnitsToMs[kDurationUnits.minutes];
  }
  if (seconds) {
    durationMs += seconds * kDurationUnitsToMs[kDurationUnits.seconds];
  }
  if (milliseconds) {
    durationMs += milliseconds;
  }

  return durationMs;
}
