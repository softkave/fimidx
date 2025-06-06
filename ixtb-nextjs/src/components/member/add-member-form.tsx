"use client";

import {
  AddMemberOnSuccessParams,
  useAddMember,
} from "@/src/lib/clientApi/member.ts";
import { zodResolver } from "@hookform/resolvers/zod";
import { IMember } from "fmdx-core/definitions/members";
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
import { Input } from "../ui/input.tsx";
import { PermissionsCheckboxes } from "./permissions-checkboxes.tsx";

export interface IAddMemberFormProps {
  groupId: string;
  onSubmitComplete: (member: IMember) => void;
}

export const addMemberFormSchema = z.object({
  email: z.string().email(),
  permissions: z.array(z.string()),
});

export function AddMemberForm(props: IAddMemberFormProps) {
  const { groupId, onSubmitComplete } = props;

  const form = useForm<z.infer<typeof addMemberFormSchema>>({
    resolver: zodResolver(addMemberFormSchema),
    defaultValues: {
      email: "",
      permissions: [],
    },
  });

  const handleSuccess = useCallback(
    (...args: AddMemberOnSuccessParams) => {
      onSubmitComplete(args[1].member);
    },
    [onSubmitComplete]
  );

  const addMemberHook = useAddMember({
    groupId,
    onSuccess: handleSuccess,
  });

  const onSubmit = useCallback(
    async (values: z.infer<typeof addMemberFormSchema>) => {
      await addMemberHook.trigger({
        groupId,
        email: values.email,
        permissions: values.permissions,
      });
    },
    [addMemberHook, groupId]
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="my logs member" {...field} />
              </FormControl>
              <FormDescription>
                This is the email of the member.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
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
          Create Member
        </Button>
      </form>
    </Form>
  );
}
