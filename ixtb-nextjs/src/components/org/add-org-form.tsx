"use client";

import {
  AddGroupOnSuccessParams,
  useAddGroup,
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

export interface IAddGroupFormProps {
  onSubmitComplete: (group: IGroup) => void;
}

export const addGroupFormSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export function AddGroupForm(props: IAddGroupFormProps) {
  const { onSubmitComplete } = props;

  const form = useForm<z.infer<typeof addGroupFormSchema>>({
    resolver: zodResolver(addGroupFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const handleSuccess = useCallback(
    (...args: AddGroupOnSuccessParams) => {
      onSubmitComplete(args[1].group);
    },
    [onSubmitComplete]
  );

  const addGroupHook = useAddGroup({
    onSuccess: handleSuccess,
  });

  const onSubmit = useCallback(
    async (values: z.infer<typeof addGroupFormSchema>) => {
      await addGroupHook.trigger({
        name: values.name,
        description: values.description,
      });
    },
    [addGroupHook]
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
          Create Group
        </Button>
      </form>
    </Form>
  );
}
