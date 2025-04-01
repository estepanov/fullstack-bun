import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import type { ComponentProps } from "react";
import { newExampleSchema } from "../../../api/src/routers/example-router";
import { usePostExampleMutation } from "../hooks/api/usePostExampleMutation";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const { fieldContext, formContext } = createFormHookContexts();

const { useAppForm } = createFormHook({
  fieldComponents: {},
  formComponents: {
    SubmitButton: (props: ComponentProps<"button">) => <Button {...props}>Submit</Button>,
  },
  fieldContext,
  formContext,
});

export const MessageForm = () => {
  const examplePostMutation = usePostExampleMutation();

  const form = useAppForm({
    defaultValues: {
      message: "",
    },
    validators: {
      onChange: newExampleSchema,
    },
    onSubmit: ({ value }) => {
      examplePostMutation.mutate({ message: value.message });
      form.reset();
    },
  });

  return (
    <form
      className="flex flex-row space-x-3 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field name="message">
        {(field) => {
          const hasError = field.state.meta.errors.length > 0;
          const showError = hasError && field.state.meta.isBlurred;
          return (
            <div className="flex flex-col space-y-1 w-full">
              <Input
                id={field.name}
                name={field.name}
                aria-invalid={showError}
                aria-describedby={`${field.name}-error`}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
              {showError ? (
                <ul id={`${field.name}-error`} role="alert">
                  {field.state.meta.errors.map((err) => (
                    <li key={err?.message}>{err?.message}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        }}
      </form.Field>
      <form.AppForm>
        <form.SubmitButton />
      </form.AppForm>
    </form>
  );
};
