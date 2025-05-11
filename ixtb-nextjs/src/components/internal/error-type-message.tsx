"use client";

import { useSearchParams } from "next/navigation";

enum AuthError {
  Configuration = "Configuration",
}

const errorMap = {
  [AuthError.Configuration]: (
    <p>
      There was a problem when trying to authenticate. Please contact us if this
      error persists. Unique error code:{" "}
      <code className="rounded-sm bg-slate-100 p-1 text-xs">Configuration</code>
    </p>
  ),
};

export function ErrorTypeMessage() {
  const search = useSearchParams();
  const error = search.get("error") as AuthError;

  return (
    <div className="font-normal text-gray-700 dark:text-gray-400">
      {errorMap[error] || "Please contact us if this error persists."}
    </div>
  );
}
