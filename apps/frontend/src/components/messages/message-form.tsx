import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { usePostExampleMutation } from "@/hooks/api/usePostExampleMutation";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import type { AnyFieldApi } from "@tanstack/react-form";
import { type ComponentProps, useRef } from "react";
import { useTranslation } from "react-i18next";
import { newExampleSchema } from "shared/interfaces/example";

const FieldInfo = ({ field }: { field: AnyFieldApi }) => {
  return (
    <>
      {(field.state.meta.isBlurred || !field.form.store.state.isFormValid) &&
      field.state.meta.errors.length ? (
        <div id={`${field.name}-error`} role="alert">
          <em>{field.state.meta.errors.map((err) => err?.message).join(", ")}</em>
        </div>
      ) : null}
    </>
  );
};

const { fieldContext, formContext } = createFormHookContexts();

const { useAppForm } = createFormHook({
  fieldComponents: {},
  formComponents: {
    SubmitButton: (props: ComponentProps<"button">) => {
      const { t } = useTranslation("messages");
      return (
        <Button type="submit" {...props}>
          {t("form.submit_button")}
        </Button>
      );
    },
  },
  fieldContext,
  formContext,
});

export const MessageForm = () => {
  const { t } = useTranslation("messages");
  const examplePostMutation = usePostExampleMutation();
  const messageFieldRef = useRef<HTMLTextAreaElement>(null);

  const form = useAppForm({
    defaultValues: {
      message: "",
    },
    validators: {
      onChange: newExampleSchema({
        messageMinLengthError: t("form.errors.messageMinLengthError"),
        messageMaxLengthError: t("form.errors.messageMaxLengthError"),
      }),
      onSubmit: newExampleSchema({
        messageMinLengthError: t("form.errors.messageMinLengthError"),
        messageMaxLengthError: t("form.errors.messageMaxLengthError"),
      }),
    },
    onSubmit: ({ value }) => {
      examplePostMutation.mutate({ message: value.message });
      form.reset();
    },
    onSubmitInvalid: ({ formApi }) => {
      const messageErrors = formApi.getAllErrors().fields.message.errors;
      if (messageErrors.length > 0) {
        messageFieldRef.current?.focus();
      }
    },
  });

  return (
    <form
      className="flex flex-row space-x-2"
      onSubmit={async (e) => {
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
              <Textarea
                ref={messageFieldRef}
                id={field.name}
                name={field.name}
                aria-label={t("form.message_field_label")}
                aria-invalid={showError}
                aria-describedby={`${field.name}-error`}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className="rounded-xl"
              />
              <FieldInfo field={field} />
            </div>
          );
        }}
      </form.Field>
      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
        // biome-ignore lint/correctness/noChildrenProp: part of form library
        children={([_, isSubmitting]) => (
          <form.SubmitButton className="rounded-xl" disabled={isSubmitting} />
        )}
      />
    </form>
  );
};
