"use client";

import { IMember } from "@/src/definitions/members.ts";
import {
  UpdateMemberOnSuccessParams,
  useUpdateMemberById,
} from "@/src/lib/clientApi/member.ts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../ui/button.tsx";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form.tsx";
import { PermissionsCheckboxes } from "./permissions-checkboxes.tsx";
export interface IUpdateMemberFormProps {
  member: IMember;
  onSubmitComplete: (member: IMember) => void;
}

export const updateMemberFormSchema = z.object({
  permissions: z.array(z.string()),
});

export function UpdateMemberForm(props: IUpdateMemberFormProps) {
  const { member, onSubmitComplete } = props;

  const form = useForm<z.infer<typeof updateMemberFormSchema>>({
    resolver: zodResolver(updateMemberFormSchema),
    defaultValues: {
      permissions: member.permissions ?? [],
    },
  });

  const handleSuccess = useCallback(
    (...args: UpdateMemberOnSuccessParams) => {
      onSubmitComplete(args[1].member);
    },
    [onSubmitComplete]
  );

  const updateMemberHook = useUpdateMemberById({
    onSuccess: handleSuccess,
    memberId: member.id,
    orgId: member.orgId,
  });

  const onSubmit = useCallback(
    async (values: z.infer<typeof updateMemberFormSchema>) => {
      await updateMemberHook.trigger({
        permissions: values.permissions,
      });
    },
    [updateMemberHook]
  );

  return (
    <Form {...form}>
      <form
        onSubmit={(evt) => {
          evt.stopPropagation();
          form.handleSubmit(onSubmit)(evt);
        }}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="permissions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Permissions</FormLabel>
              <FormControl>
                <PermissionsCheckboxes
                  permissions={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                This is the permissions of the member.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Update Member
        </Button>
      </form>
    </Form>
  );
}
