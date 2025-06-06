import assert from "assert";
import {
  ILogField,
  LogPartFilterItem,
  LogPartFilterList,
} from "fmdx-core/definitions/log";
import { Loader2, PlusIcon, XIcon } from "lucide-react";
import { ComponentProps, useMemo, useState } from "react";
import { Button } from "../../ui/button";
import { LogsFilterItem } from "./logs-filter-item";
import { IWorkingLogPartFilterItem } from "./types";

export interface ILogsFilterListProps {
  groupId: string;
  appId: string;
  onChange: (filters: LogPartFilterList) => void;
  filters?: LogPartFilterList;
  fields: ILogField[];
  applyButtonText?: string;
  applyButtonClassName?: string;
  applyButtonVariant?: ComponentProps<typeof Button>["variant"];
  applyButtonType?: ComponentProps<typeof Button>["type"];
  applyButtonDisabled?: boolean;
  applyButtonLoading?: boolean;
  disabled?: boolean;
  hijackApplyButtonOnClick?: () => void;
}

function validateFilter(
  filter: IWorkingLogPartFilterItem
): IWorkingLogPartFilterItem {
  switch (filter.op) {
    case "eq":
    case "neq":
    case "gt":
    case "gte":
    case "lt":
    case "lte": {
      if (filter.value?.length === 0) {
        return {
          ...filter,
          error: "Value is required",
        };
      }

      assert(filter.value);
      const value = Number(filter.value[0]);
      if (isNaN(value)) {
        return {
          ...filter,
          error: "Invalid value",
        };
      }

      return {
        ...filter,
        error: undefined,
      };
    }
    case "like":
    case "ilike":
      if (filter.value?.length === 0) {
        return {
          ...filter,
          error: "Value is required",
        };
      }
      return {
        ...filter,
        error: undefined,
      };
    case "in":
    case "not_in":
      if (filter.value?.length === 0) {
        return {
          ...filter,
          error: "At least one value is required",
        };
      }
      return {
        ...filter,
        error: undefined,
      };
    case "between":
      if (filter.value?.length !== 2) {
        return {
          ...filter,
          error: "Both values are required",
        };
      }

      assert(filter.value);
      const value1 = Number(filter.value[0]);
      if (isNaN(value1)) {
        return {
          ...filter,
          error: "First value is invalid",
        };
      }

      const value2 = Number(filter.value[1]);
      if (isNaN(value2)) {
        return {
          ...filter,
          error: "Second value is invalid",
        };
      }

      return {
        ...filter,
        error: undefined,
      };
    default:
      return {
        ...filter,
        error: undefined,
      };
  }
}

function workingFilterToFilter(
  filter: IWorkingLogPartFilterItem
): LogPartFilterItem {
  assert(filter.name, "Name is required");
  assert(filter.op, "Op is required");
  assert(filter.value, "Value is required");
  return {
    name: filter.name,
    op: filter.op,
    value: filter.value,
  };
}

export function LogsFilterList(props: ILogsFilterListProps) {
  const {
    groupId,
    appId,
    onChange,
    filters: initialFilters,
    fields,
    applyButtonText,
    applyButtonClassName,
    applyButtonVariant,
    applyButtonType,
    applyButtonDisabled,
    applyButtonLoading,
    disabled,
    hijackApplyButtonOnClick,
  } = props;
  const [filters, setFilters] = useState<IWorkingLogPartFilterItem[]>(
    initialFilters?.map(validateFilter) ?? []
  );

  const hasFilters = useMemo(() => {
    return filters.length > 0;
  }, [filters]);

  const handleChange = (item: IWorkingLogPartFilterItem, index: number) => {
    const newFilters = [...filters];
    newFilters[index] = item;
    setFilters(newFilters);
  };

  const handleRemoveFilter = (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index);
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    const newFilters = filters.map(validateFilter);
    setFilters(newFilters);

    const hasErrors = newFilters.some((filter) => filter.error);
    if (hasErrors) {
      return;
    }

    onChange(newFilters.map(workingFilterToFilter));
  };

  const itemsNode = filters.map((filter, index) => {
    return (
      <LogsFilterItem
        key={filter.name}
        item={filter}
        onChange={(value) => handleChange(value, index)}
        onRemove={() => handleRemoveFilter(index)}
        groupId={groupId}
        appId={appId}
        fields={fields}
        disabled={disabled}
      />
    );
  });

  const handleAddFilter = () => {
    setFilters((prev) => [...prev, { name: "", value: [], op: "eq" }]);
  };

  const handleClearFilters = () => {
    setFilters([]);
    onChange([]);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {itemsNode}
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={handleClearFilters}
            disabled={!hasFilters || disabled}
            className="w-full"
          >
            <XIcon className="h-4 w-4" />
            Clear filters
          </Button>
          <Button
            variant="outline"
            onClick={handleAddFilter}
            className="w-full"
            disabled={disabled}
          >
            <PlusIcon className="h-4 w-4" />
            Add filter
          </Button>
        </div>
        <Button
          onClick={() => {
            if (hijackApplyButtonOnClick) {
              hijackApplyButtonOnClick();
            } else {
              handleApplyFilters();
            }
          }}
          disabled={applyButtonDisabled || !hasFilters || applyButtonLoading}
          className={applyButtonClassName}
          variant={applyButtonVariant}
          type={applyButtonType}
        >
          {applyButtonLoading && (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          )}
          {applyButtonText ?? "Apply filters"}
        </Button>
      </div>
    </div>
  );
}
