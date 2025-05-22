import { LogPartFilterItem } from "fmdx-core/definitions/log";

export interface IWorkingLogPartFilterItem extends Partial<LogPartFilterItem> {
  error?: string;
}
