import { Skeleton } from "../ui/skeleton";
import { MemberListContainer } from "./members-container";
import { SelectMember, SelectMemberProps } from "./select-member";

export type ISelectMemberContainerProps = Pick<
  SelectMemberProps,
  | "groupId"
  | "selected"
  | "onChange"
  | "loading"
  | "disabled"
  | "showAddMember"
  | "size"
  | "variant"
  | "color"
  | "renderPrefix"
  | "maxSelectedMembers"
  | "selectedItemsPosition"
  | "renderSuffix"
  | "mainNodeClassName"
  | "isForm"
>;

export function SelectMemberContainer(props: ISelectMemberContainerProps) {
  return (
    <MemberListContainer
      groupId={props.groupId}
      render={(data) => {
        return (
          <SelectMember {...props} members={data} mainNodeClassName="w-full" />
        );
      }}
      renderLoading={() => {
        return <Skeleton className="w-full h-8" />;
      }}
      membersContainerClassName="w-full"
    />
  );
}
