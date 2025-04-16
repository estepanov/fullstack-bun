import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import type { AnyFieldApi } from "@tanstack/react-form";
import type { ComponentProps } from "react";
import { newExampleSchema } from "shared/interfaces/example";
import { usePostExampleMutation } from "../hooks/api/usePostExampleMutation";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const FieldInfo = ({ field }: { field: AnyFieldApi }) => {
  return (
    <>
      {field.state.meta.isBlurred && field.state.meta.errors.length ? (
        <div id={`${field.name}-error`} role="alert">
          <em>{field.state.meta.errors.map((err) => err?.message).join(", ")}</em>
        </div>
      ) : null}
      {field.state.meta.isValidating ? "Validating..." : null}
    </>
  );
};

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
              <label htmlFor={field.name}>Message</label>
              <Input
                id={field.name}
                name={field.name}
                aria-invalid={showError}
                aria-describedby={`${field.name}-error`}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
              <FieldInfo field={field} />
            </div>
          );
        }}
      </form.Field>
    </form>
  );
};
