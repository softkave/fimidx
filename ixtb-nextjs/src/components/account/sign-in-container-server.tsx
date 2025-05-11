import { AppHeader } from "../internal/app-header.tsx";
import { Separator } from "../ui/separator.tsx";
import { EmailSignInServer } from "./email-sigin-in-server.tsx";
import GoogleSignInServer from "./google-sign-in-server.tsx";

export interface ISignInContainerServerProps {
  redirectTo?: string;
}

export function SignInContainerServer({
  redirectTo,
}: ISignInContainerServerProps) {
  return (
    <main className="flex flex-col h-screen flex-1">
      <AppHeader />
      <div className="flex flex-col items-center flex-1 px-4 m-auto gap-4 mt-12">
        <EmailSignInServer redirectTo={redirectTo} />
        <Separator />
        <GoogleSignInServer redirectTo={redirectTo} buttonClassName="w-full" />
      </div>
    </main>
  );
}
