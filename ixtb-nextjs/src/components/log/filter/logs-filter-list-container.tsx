"use client";

import { useGetLogFields } from "@/src/lib/clientApi/log.ts";
import { cn } from "@/src/lib/utils.ts";
import { PageMessage } from "../../internal/page-message";
import { WrapLoader } from "../../internal/wrap-loader";
import { ILogsFilterListProps, LogsFilterList } from "./logs-filter-list";

export interface ILogsFilterListContainerProps
  extends Pick<
    ILogsFilterListProps,
    | "groupId"
    | "appId"
    | "onChange"
    | "filters"
    | "applyButtonText"
    | "applyButtonClassName"
    | "applyButtonVariant"
    | "applyButtonType"
    | "disabled"
    | "applyButtonDisabled"
    | "hijackApplyButtonOnClick"
    | "applyButtonLoading"
  > {
  className?: string;
}

export function LogsFilterListContainer({
  className,
  groupId,
  appId,
  onChange,
  filters,
  applyButtonText,
  disabled,
  applyButtonDisabled,
  hijackApplyButtonOnClick,
  applyButtonLoading,
}: ILogsFilterListContainerProps) {
  const getLogFieldsHook = useGetLogFields({ appId });

  return (
    <div className={cn("flex flex-col items-center w-full", className)}>
      <WrapLoader
        isLoading={getLogFieldsHook.isLoading}
        error={getLogFieldsHook.error}
        data={getLogFieldsHook.data}
        render={(data) =>
          data.fields.length === 0 ? (
            <PageMessage
              title="No log fields"
              message="No log fields found"
              className="px-0 flex flex-col items-center justify-center py-32"
            />
          ) : (
            <LogsFilterList
              fields={data.fields}
              groupId={groupId}
              appId={appId}
              onChange={onChange}
              filters={filters}
              applyButtonText={applyButtonText}
              disabled={disabled}
              applyButtonDisabled={applyButtonDisabled}
              hijackApplyButtonOnClick={hijackApplyButtonOnClick}
              applyButtonLoading={applyButtonLoading}
            />
          )
        }
      />
    </div>
  );
}
