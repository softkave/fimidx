"use client";

import { useSearchParams } from "next/navigation";

enum VerificationType {
  Email = "email",
}

const typeMap = {
  [VerificationType.Email]: (
    <p>
      A verification link has been sent to your email. Please check your email
      and click the link to verify your email.
    </p>
  ),
};

export function VerifyRequestMessage() {
  const search = useSearchParams();
  const type = search.get("type") as VerificationType;

  return (
    <div className="font-normal text-gray-700 dark:text-gray-400">
      {typeMap[type] || "Hello."}
    </div>
  );
}
