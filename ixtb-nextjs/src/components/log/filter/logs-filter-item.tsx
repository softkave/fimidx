import {
  ILogField,
  LogPartFilterItemOp,
  logPartFilterItemOpSchema,
} from "fmdx-core/definitions/log";
import { flatten } from "lodash-es";
import { XIcon } from "lucide-react";
import { useMemo } from "react";
import { Button } from "../../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Textarea } from "../../ui/textarea";
import { BetweenNumberOrDateInput } from "./between-number-or-date-input";
import { InInputContainer } from "./in-input-container";
import { NumberOrDateInput } from "./number-or-date-input";
import { IWorkingLogPartFilterItem } from "./types";

const kOps = logPartFilterItemOpSchema.Values;
const kOpLabels = {
  [kOps.eq]: "Equal to",
  [kOps.neq]: "Not equal to",
  [kOps.gt]: "Greater than",
  [kOps.gte]: "Greater than or equal to",
  [kOps.lt]: "Less than",
  [kOps.lte]: "Less than or equal to",
  [kOps.like]: "Like",
  [kOps.ilike]: "Case insensitive like",
  [kOps.in]: "In",
  [kOps.not_in]: "Not in",
  [kOps.between]: "Between",
};

type ValueType = "string" | "number" | "boolean" | "null" | "undefined";
const kValueTypeToAllowedOps: Record<ValueType, LogPartFilterItemOp[]> = {
  string: [kOps.eq, kOps.neq, kOps.like, kOps.ilike, kOps.in, kOps.not_in],
  number: [
    kOps.eq,
    kOps.neq,
    kOps.gt,
    kOps.gte,
    kOps.lt,
    kOps.lte,
    kOps.between,
  ],
  boolean: [kOps.eq, kOps.neq],
  null: [kOps.eq, kOps.neq],
  undefined: [kOps.eq, kOps.neq],
};

export interface ILogsFilterItemProps {
  groupId: string;
  appId: string;
  item: IWorkingLogPartFilterItem;
  fields: ILogField[];
  onChange: (value: IWorkingLogPartFilterItem) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function LogsFilterItem(props: ILogsFilterItemProps) {
  const { fields, item, onChange, onRemove, appId, disabled } = props;

  const field = useMemo(() => {
    return fields.find((f) => f.name === item.name);
  }, [fields, item.name]);

  const ops = useMemo(() => {
    return field
      ? flatten(
          field.valueType
            .split(",")
            .map((t) => kValueTypeToAllowedOps[t as ValueType])
        )
      : [];
  }, [field]);

  const renderSelectName = () => {
    return (
      <Select
        value={item.name}
        onValueChange={(value) => {
          onChange({
            ...item,
            name: value,
            op: undefined,
            value: [],
          });
        }}
        disabled={disabled}
      >
        <SelectTrigger className="w-[180px] w-full">
          <SelectValue placeholder="Field" />
        </SelectTrigger>
        <SelectContent>
          {fields?.map((field) => (
            <SelectItem key={field.id} value={field.name}>
              <pre>
                <code>{field.name}</code>
              </pre>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  const renderSelectOp = () => {
    return (
      <Select
        value={item.op}
        onValueChange={(value) => {
          onChange({ ...item, op: value as LogPartFilterItemOp, value: [] });
        }}
        disabled={!field || disabled}
      >
        <SelectTrigger className="w-[180px] w-full">
          <SelectValue placeholder="Operator" />
        </SelectTrigger>
        <SelectContent>
          {ops.map((op) => (
            <SelectItem key={op} value={op}>
              <span className="text-sm font-medium">{kOpLabels[op]}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  const renderSelectValue = () => {
    if (!item.name) {
      return null;
    }

    switch (item.op) {
      case kOps.in:
      case kOps.not_in:
        return (
          <InInputContainer
            appId={appId}
            value={item.value ?? []}
            onChange={(value) => onChange({ ...item, value })}
            fieldName={item.name}
            disabled={disabled}
          />
        );
      case kOps.between:
        return (
          <BetweenNumberOrDateInput
            value={item.value ?? []}
            onChange={(value) => onChange({ ...item, value })}
            fieldName={item.name}
            disabled={disabled}
          />
        );
      case kOps.like:
      case kOps.ilike:
      case kOps.eq:
      case kOps.neq:
        return (
          <Textarea
            value={item.value ?? []}
            onChange={(e) => onChange({ ...item, value: [e.target.value] })}
            disabled={disabled}
          />
        );
      case kOps.gt:
      case kOps.gte:
      case kOps.lt:
      case kOps.lte:
        return (
          <NumberOrDateInput
            value={item.value ?? []}
            onChange={(value) => onChange({ ...item, value })}
            fieldName={item.name}
            disabled={disabled}
          />
        );
      default:
        return null;
    }
  };

  const renderDeleteButton = () => {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={onRemove}
        disabled={disabled}
      >
        <XIcon className="h-4 w-4" />
      </Button>
    );
  };

  const renderError = () => {
    if (!item.error) {
      return null;
    }

    return <div className="text-red-500">{item.error}</div>;
  };

  const render = () => {
    switch (item.op) {
      case kOps.between:
      case kOps.like:
      case kOps.ilike:
      case kOps.eq:
      case kOps.neq:
      case kOps.gt:
      case kOps.gte:
      case kOps.lt:
      case kOps.lte:
        return (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[1fr_auto_auto] gap-2 overflow-hidden">
              <div>{renderSelectName()}</div>
              <div>{renderSelectOp()}</div>
              <div>{renderDeleteButton()}</div>
            </div>
            {renderSelectValue()}
            {renderError()}
          </div>
        );
      case kOps.not_in:
      case kOps.in:
      default:
        return (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 overflow-hidden">
              <div>{renderSelectName()}</div>
              <div>{renderSelectOp()}</div>
              <div className="overflow-hidden">{renderSelectValue()}</div>
              <div>{renderDeleteButton()}</div>
            </div>
            {renderError()}
          </div>
        );
    }
  };

  return render();
}
