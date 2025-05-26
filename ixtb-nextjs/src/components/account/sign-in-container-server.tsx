import { cn } from "@/src/lib/utils.ts";
import { Separator } from "../ui/separator.tsx";
import { EmailSignInServer } from "./email-sigin-in-server.tsx";
import GoogleSignInServer from "./google-sign-in-server.tsx";

export interface ISignInContainerServerProps {
  redirectTo?: string;
  className?: string;
}

export function SignInContainerServer({
  redirectTo,
  className,
}: ISignInContainerServerProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center flex-1 px-4 m-auto gap-4 mt-12",
        className
      )}
    >
      <EmailSignInServer redirectTo={redirectTo} />
      <Separator />
      <GoogleSignInServer redirectTo={redirectTo} buttonClassName="w-full" />
    </div>
  );
}
