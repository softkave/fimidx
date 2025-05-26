"use client";

import { cn } from "@/src/lib/utils.ts";
import { Separator } from "../ui/separator.tsx";
import { EmailSignInClient } from "./email-sign-in-client.tsx";
import GoogleSignInClient from "./google-sign-in-client.tsx";
export interface ISignInContainerClientProps {
  redirectTo?: string;
  className?: string;
}

export function SignInContainerClient({
  redirectTo,
  className,
}: ISignInContainerClientProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex flex-col items-center flex-1 m-auto gap-4 max-w-md mx-auto">
        <div className="md:px-4 w-full">
          <EmailSignInClient redirectTo={redirectTo} />
        </div>
        <Separator className="my-4" />
        <div className="md:px-4 w-full">
          <GoogleSignInClient redirectTo={redirectTo} />
        </div>
      </div>
    </div>
  );
}
