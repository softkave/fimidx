import { LogPartFilterItem } from "@/src/definitions/log";

export interface IWorkingLogPartFilterItem extends Partial<LogPartFilterItem> {
  error?: string;
}
