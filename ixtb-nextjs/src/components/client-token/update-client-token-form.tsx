"use client";

import {
  UpdateClientTokenOnSuccessParams,
  useUpdateClientToken,
} from "@/src/lib/clientApi/clientToken.ts";
import { zodResolver } from "@hookform/resolvers/zod";
import { IClientToken } from "fmdx-core/definitions/clientToken";
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

export interface IUpdateClientTokenFormProps {
  clientToken: IClientToken;
  onSubmitComplete: (clientToken: IClientToken) => void;
}

export const addClientTokenFormSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export function UpdateClientTokenForm(props: IUpdateClientTokenFormProps) {
  const { clientToken, onSubmitComplete } = props;

  const form = useForm<z.infer<typeof addClientTokenFormSchema>>({
    resolver: zodResolver(addClientTokenFormSchema),
    defaultValues: {
      name: clientToken.name,
      description: clientToken.description ?? "",
    },
  });

  const handleSuccess = useCallback(
    (...args: UpdateClientTokenOnSuccessParams) => {
      onSubmitComplete(args[1].clientToken);
    },
    [onSubmitComplete]
  );

  const updateClientTokenHook = useUpdateClientToken({
    onSuccess: handleSuccess,
    clientTokenId: clientToken.id,
    appId: clientToken.appId,
  });

  const onSubmit = useCallback(
    async (values: z.infer<typeof addClientTokenFormSchema>) => {
      await updateClientTokenHook.trigger({
        id: clientToken.id,
        name: values.name,
        description: values.description,
      });
    },
    [updateClientTokenHook, clientToken.id]
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
                <Input placeholder="my logs client token" {...field} />
              </FormControl>
              <FormDescription>
                This is the name of the client token.
              </FormDescription>
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
                <Textarea placeholder="my logs client token" {...field} />
              </FormControl>
              <FormDescription>
                This is the description of the client token.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Update Client Token
        </Button>
      </form>
    </Form>
  );
}
