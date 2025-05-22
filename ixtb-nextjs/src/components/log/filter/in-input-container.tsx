import { useGetLogFieldValues } from "@/src/lib/clientApi/log";
import { useState } from "react";
import { PageError } from "../../internal/error";
import { PageMessage } from "../../internal/page-message";
import { WrapLoader } from "../../internal/wrap-loader";
import { InInput } from "./in-input";

export function InInputContainer(props: {
  appId: string;
  value: string[];
  onChange: (value: string[]) => void;
  fieldName: string;
  disabled?: boolean;
}) {
  const { appId, value, onChange, fieldName, disabled } = props;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const getLogFieldValuesHook = useGetLogFieldValues({
    appId,
    fieldName,
    page,
    limit: pageSize,
  });

  return (
    <WrapLoader
      isLoading={getLogFieldValuesHook.isLoading}
      error={getLogFieldValuesHook.error}
      data={getLogFieldValuesHook.data}
      loadingClassName="py-2"
      renderError={(error) => {
        return (
          <PageError
            error={error}
            showTitle={false}
            errorTextClassName="w-full max-w-full truncate overflow-hidden"
            variant="secondary"
            className="w-full overflow-hidden py-2"
            wrapInTooltip
          />
        );
      }}
      render={(data) =>
        data.values.length === 0 ? (
          <PageMessage
            title="No values"
            message="No values found"
            className="px-0 flex flex-col items-center justify-center py-32"
          />
        ) : (
          <InInput
            value={value}
            onChange={onChange}
            options={data.values.map((v) => String(v))}
            fieldName={fieldName}
            pageSize={pageSize}
            page={page}
            setPage={setPage}
            setPageSize={setPageSize}
            total={data.total}
            isLoading={getLogFieldValuesHook.isLoading}
            disabled={disabled}
          />
        )
      }
    />
  );
}
