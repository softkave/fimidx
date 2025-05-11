import { cn } from "@/src/lib/utils.ts";
import { AppHeader } from "../internal/app-header.tsx";
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
    <main className={cn("flex flex-col h-screen flex-1", className)}>
      <AppHeader />
      <div className="flex flex-col items-center flex-1 px-4 m-auto gap-4 mt-12">
        <EmailSignInClient redirectTo={redirectTo} />
        <Separator />
        <GoogleSignInClient redirectTo={redirectTo} />
      </div>
    </main>
  );
}
