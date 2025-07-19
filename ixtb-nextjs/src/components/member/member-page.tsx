import { AppPage } from "../internal/app-page";
import { MemberContainer } from "./member-container";

export interface IMemberPageProps {
  orgId: string;
  memberId: string;
}

export function MemberPage(props: IMemberPageProps) {
  return (
    <AppPage>
      <MemberContainer memberId={props.memberId} />
    </AppPage>
  );
}
