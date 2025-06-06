"use client";

import {
  UpdateGroupOnSuccessParams,
  useUpdateGroup,
} from "@/src/lib/clientApi/group.ts";
import { zodResolver } from "@hookform/resolvers/zod";
import { IGroup } from "fmdx-core/definitions/group";
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
import { Textarea } from "../ui/textarea.tsx";

export interface IUpdateGroupFormProps {
  group: IGroup;
  onSubmitComplete: (group: IGroup) => void;
}

export const addGroupFormSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export function UpdateGroupForm(props: IUpdateGroupFormProps) {
  const { group, onSubmitComplete } = props;

  const form = useForm<z.infer<typeof addGroupFormSchema>>({
    resolver: zodResolver(addGroupFormSchema),
    defaultValues: {
      name: group.name,
      description: group.description ?? "",
    },
  });

  const handleSuccess = useCallback(
    (...args: UpdateGroupOnSuccessParams) => {
      onSubmitComplete(args[1].group);
    },
    [onSubmitComplete]
  );

  const updateGroupHook = useUpdateGroup({
    onSuccess: handleSuccess,
    groupId: group.id,
  });

  const onSubmit = useCallback(
    async (values: z.infer<typeof addGroupFormSchema>) => {
      await updateGroupHook.trigger({
        name: values.name,
        description: values.description,
      });
    },
    [updateGroupHook]
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="my logs group" {...field} />
              </FormControl>
              <FormDescription>This is the name of the group.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="my logs group" {...field} />
              </FormControl>
              <FormDescription>
                This is the description of the group.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Update Group
        </Button>
      </form>
    </Form>
  );
}
