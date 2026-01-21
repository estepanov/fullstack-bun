import { useAdminSendNotificationMutation } from "@admin/hooks/api/useAdminSendNotificationMutation";
import { useAdminUserSearchQuery } from "@admin/hooks/api/useAdminUserSearchQuery";
import { type FormValidateOrFn, useForm } from "@tanstack/react-form";
import {
  Badge,
  Button,
  Card,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "frontend-common/components/ui";
import { Check, Plus, Trash2, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  NotificationActionType,
  NotificationType,
  deliveryStrategySchema,
  notificationActionVariantSchema,
  notificationPrioritySchema,
} from "shared/interfaces/notification";
import { toast } from "sonner";
import { z } from "zod";

const MAX_RECIPIENTS = 10000;

const priorityEnum = z.enum(notificationPrioritySchema.options);
const actionVariantEnum = z.enum(notificationActionVariantSchema.options);
const deliveryStrategyEnum = z.enum(deliveryStrategySchema.options);

const formSchema = z
  .object({
    targetScope: z.enum(["user", "users", "all"]),
    singleIdentifier: z.string().trim(),
    multipleIdentifiers: z.string().trim(),
    type: z.nativeEnum(NotificationType),
    title: z.string().trim().min(1).max(255),
    content: z.string().trim().min(1).max(1000),
    metadata: z.object({
      priority: z.union([priorityEnum, z.literal("none")]).optional(),
      expiresAt: z.string().optional(),
      actionGroupVariant: z.union([actionVariantEnum, z.literal("none")]).optional(),
      dataJson: z.string().optional(),
      actions: z
        .array(
          z.object({
            uid: z.string(),
            actionId: z.string().trim().min(1).max(100),
            label: z.string().trim().min(1).max(100),
            url: z.string().trim().min(1),
            variant: actionVariantEnum.optional(),
            openInNewTab: z.boolean(),
          }),
        )
        .default([]),
    }),
    delivery: z.object({
      immediate: z.boolean(),
      strategies: z.array(deliveryStrategyEnum).default([]),
    }),
    confirmAll: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.targetScope === "user" && values.singleIdentifier.length === 0) {
      ctx.addIssue({
        path: ["singleIdentifier"],
        code: z.ZodIssueCode.custom,
        message: "Provide a user id or email.",
      });
    }

    if (values.targetScope === "users") {
      const identifiers = parseIdentifiers(values.multipleIdentifiers);
      if (identifiers.length === 0) {
        ctx.addIssue({
          path: ["multipleIdentifiers"],
          code: z.ZodIssueCode.custom,
          message: "Add at least one user id or email.",
        });
      }
      if (identifiers.length > MAX_RECIPIENTS) {
        ctx.addIssue({
          path: ["multipleIdentifiers"],
          code: z.ZodIssueCode.custom,
          message: `Recipient limit is ${MAX_RECIPIENTS}.`,
        });
      }
    }

    if (values.targetScope === "all" && !values.confirmAll) {
      ctx.addIssue({
        path: ["confirmAll"],
        code: z.ZodIssueCode.custom,
        message: "Confirm you want to notify all users.",
      });
    }

    if (values.metadata.expiresAt) {
      const parsed = Date.parse(values.metadata.expiresAt);
      if (Number.isNaN(parsed)) {
        ctx.addIssue({
          path: ["metadata", "expiresAt"],
          code: z.ZodIssueCode.custom,
          message: "Use a valid date/time.",
        });
      }
    }

    if (values.metadata.dataJson && values.metadata.dataJson.trim().length > 0) {
      try {
        const parsed = JSON.parse(values.metadata.dataJson);
        if (parsed === null || Array.isArray(parsed) || typeof parsed !== "object") {
          ctx.addIssue({
            path: ["metadata", "dataJson"],
            code: z.ZodIssueCode.custom,
            message: "Metadata JSON must be an object.",
          });
        }
      } catch {
        ctx.addIssue({
          path: ["metadata", "dataJson"],
          code: z.ZodIssueCode.custom,
          message: "Metadata JSON must be valid JSON.",
        });
      }
    }
  });

type FormValues = z.infer<typeof formSchema>;

type SearchUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: string;
};

const parseIdentifiers = (value: string) =>
  value
    .split(/[\n,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);

const toFieldErrors = (errors: Array<string | { message?: string } | undefined> = []) =>
  errors.map((error) => {
    if (typeof error === "string") {
      return { message: error };
    }
    // Handle array of error objects
    if (Array.isArray(error)) {
      const messages = error
        .map((err) => (err && typeof err === "object" && err.message) || null)
        .filter(Boolean)
        .join(", ");
      return { message: messages || "Validation error" };
    }
    if (error && typeof error === "object" && typeof error.message === "string") {
      return { message: error.message };
    }
    if (error && typeof error === "object") {
      return { message: JSON.stringify(error) };
    }
    return { message: String(error) };
  });

const createAction = () => ({
  uid: crypto.randomUUID(),
  actionId: "",
  label: "",
  url: "",
  variant: undefined,
  openInNewTab: false,
});

const DEFAULT_VALUES: FormValues = {
  targetScope: "user",
  singleIdentifier: "",
  multipleIdentifiers: "",
  type: NotificationType.ANNOUNCEMENT,
  title: "",
  content: "",
  metadata: {
    priority: "none",
    expiresAt: "",
    actionGroupVariant: "none",
    dataJson: "",
    actions: [],
  },
  delivery: {
    immediate: true,
    strategies: [],
  },
  confirmAll: false,
};

const notificationTypes = Object.values(NotificationType);
const deliveryStrategies = deliveryStrategySchema.options;
const actionVariants = notificationActionVariantSchema.options;
const priorityOptions = notificationPrioritySchema.options;

export default function AdminSendNotificationsPage() {
  const { t } = useTranslation("admin");
  const sendMutation = useAdminSendNotificationMutation();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const searchQueryEnabled = debouncedSearchQuery.trim().length >= 2;
  const { data: searchData, isFetching: isSearching } = useAdminUserSearchQuery({
    query: debouncedSearchQuery,
    limit: 12,
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const form = useForm<
    FormValues,
    undefined,
    FormValidateOrFn<FormValues>,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined
  >({
    defaultValues: DEFAULT_VALUES,
    validators: {
      // Cast to FormValidateOrFn since Zod v4 isn't typed as StandardSchemaV1
      onChange: formSchema as FormValidateOrFn<FormValues>,
    },
    onSubmit: async ({ value }) => {
      const { metadata, delivery, targetScope, singleIdentifier, multipleIdentifiers } =
        value;

      const identifiers = parseIdentifiers(multipleIdentifiers);
      const notificationMetadata = {
        ...(metadata.priority && metadata.priority !== "none"
          ? { priority: metadata.priority }
          : {}),
        ...(metadata.actionGroupVariant && metadata.actionGroupVariant !== "none"
          ? { actionGroupVariant: metadata.actionGroupVariant }
          : {}),
        ...(metadata.expiresAt
          ? { expiresAt: new Date(metadata.expiresAt).toISOString() }
          : {}),
        ...(metadata.dataJson?.trim() ? { data: JSON.parse(metadata.dataJson) } : {}),
        actions: metadata.actions.map((action) => ({
          actionId: action.actionId,
          type: NotificationActionType.LINK,
          label: action.label,
          url: action.url,
          variant: action.variant,
          openInNewTab: action.openInNewTab,
        })),
      };

      const payload = {
        target:
          targetScope === "all"
            ? { scope: "all" as const }
            : targetScope === "user"
              ? { scope: "user" as const, identifier: singleIdentifier }
              : { scope: "users" as const, identifiers },
        notification: {
          type: value.type,
          title: value.title,
          content: value.content,
          metadata: notificationMetadata,
          deliveryOptions: {
            immediate: delivery.immediate,
            ...(delivery.strategies.length > 0
              ? { strategies: delivery.strategies }
              : {}),
          },
        },
      };

      const response = await sendMutation.mutateAsync(payload);
      toast.success(t("notifications.send_success"), {
        description: t("notifications.send_success_description", {
          created: response.createdCount,
          total: response.targetCount,
        }),
      });
      form.reset();
      setSearchInput("");
    },
  });

  const searchResults: SearchUser[] = useMemo(() => {
    if (!searchQueryEnabled) return [];
    if (!searchData?.success) return [];
    return (searchData.users ?? []) as SearchUser[];
  }, [searchData, searchQueryEnabled]);

  const addIdentifier = (identifier: string) => {
    if (form.state.values.targetScope === "user") {
      form.setFieldValue("singleIdentifier", identifier);
      return;
    }

    const current = parseIdentifiers(form.state.values.multipleIdentifiers);
    const next = Array.from(new Set([...current, identifier]));
    form.setFieldValue("multipleIdentifiers", next.join("\n"));
  };

  const isIdentifierAdded = (identifier: string) => {
    if (form.state.values.targetScope === "user") {
      return form.state.values.singleIdentifier === identifier;
    }

    if (form.state.values.targetScope === "users") {
      const current = parseIdentifiers(form.state.values.multipleIdentifiers);
      return current.includes(identifier);
    }

    return false;
  };

  const selectedScope = form.state.values.targetScope;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm shadow-black/5 backdrop-blur">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {t("notifications.title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("notifications.description")}
        </p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          form.handleSubmit();
        }}
        className="grid gap-6"
      >
        <Card className="p-6">
          <FieldSet>
            <FieldLegend>{t("notifications.recipients.title")}</FieldLegend>
            <FieldDescription>
              {t("notifications.recipients.description")}
            </FieldDescription>
            <FieldGroup>
              <form.Field name="targetScope">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      {t("notifications.recipients.scope_label")}
                    </FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) =>
                        field.handleChange(value as FormValues["targetScope"])
                      }
                    >
                      <SelectTrigger id={field.name}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">
                          {t("notifications.recipients.scope_user")}
                        </SelectItem>
                        <SelectItem value="users">
                          {t("notifications.recipients.scope_users")}
                        </SelectItem>
                        <SelectItem value="all">
                          {t("notifications.recipients.scope_all")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </form.Field>

              {selectedScope === "user" && (
                <form.Field name="singleIdentifier">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        {t("notifications.recipients.single_label")}
                      </FieldLabel>
                      <Input
                        id={field.name}
                        placeholder={t("notifications.recipients.single_placeholder")}
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                      />
                      <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                    </Field>
                  )}
                </form.Field>
              )}

              {selectedScope === "users" && (
                <form.Field name="multipleIdentifiers">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        {t("notifications.recipients.multiple_label")}
                      </FieldLabel>
                      <Textarea
                        id={field.name}
                        placeholder={t("notifications.recipients.multiple_placeholder")}
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        rows={4}
                      />
                      <FieldDescription>
                        {t("notifications.recipients.multiple_helper")}
                      </FieldDescription>
                      <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                    </Field>
                  )}
                </form.Field>
              )}

              {selectedScope === "all" && (
                <form.Field name="confirmAll">
                  {(field) => (
                    <Field>
                      <div className="flex items-center gap-3 text-sm">
                        <Input
                          id={field.name}
                          type="checkbox"
                          checked={field.state.value}
                          onChange={(event) => field.handleChange(event.target.checked)}
                          onBlur={field.handleBlur}
                          className="h-4 w-4"
                        />
                        <FieldLabel htmlFor={field.name} className="font-normal">
                          {t("notifications.recipients.confirm_all")}
                        </FieldLabel>
                      </div>
                      <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                    </Field>
                  )}
                </form.Field>
              )}

              <Field>
                <FieldLabel htmlFor="recipient-search">
                  {t("notifications.recipients.search_label")}
                </FieldLabel>
                <Input
                  id="recipient-search"
                  placeholder={t("notifications.recipients.search_placeholder")}
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                />
                {searchQueryEnabled && (
                  <form.Subscribe
                    selector={(state) => [
                      state.values.singleIdentifier,
                      state.values.multipleIdentifiers,
                    ]}
                  >
                    {() => (
                      <div className="mt-3 rounded-xl border border-border/60 bg-muted/30 p-3 text-sm">
                        {isSearching ? (
                          <div>{t("notifications.recipients.search_loading")}</div>
                        ) : searchResults.length === 0 ? (
                          <div className="text-muted-foreground">
                            {t("notifications.recipients.search_empty")}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {searchResults.map((result) => {
                              const identifier = result.email ?? result.id;
                              const isAdded = isIdentifierAdded(identifier);
                              return (
                                <button
                                  key={result.id}
                                  type="button"
                                  onClick={() => !isAdded && addIdentifier(identifier)}
                                  disabled={isAdded}
                                  className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background px-3 py-2 text-left text-sm transition hover:border-primary/40 disabled:cursor-default disabled:opacity-100 disabled:hover:border-border/60"
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {result.name ||
                                        t("notifications.recipients.unknown_name")}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {result.email}
                                    </span>
                                  </div>
                                  {isAdded ? (
                                    <Badge variant="success" size="sm">
                                      <Check className="mr-1 h-3 w-3" />
                                      {t("notifications.recipients.added")}
                                    </Badge>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-primary">
                                      <UserPlus className="h-4 w-4" />
                                      {t("notifications.recipients.add")}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </form.Subscribe>
                )}
              </Field>
            </FieldGroup>
          </FieldSet>
        </Card>

        <Card className="p-6">
          <FieldSet>
            <FieldLegend>{t("notifications.message.title")}</FieldLegend>
            <FieldDescription>{t("notifications.message.description")}</FieldDescription>
            <FieldGroup>
              <form.Field name="type">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      {t("notifications.message.type")}
                    </FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) =>
                        field.handleChange(value as NotificationType)
                      }
                    >
                      <SelectTrigger id={field.name}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {notificationTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </form.Field>

              <form.Field name="title">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      {t("notifications.message.title_label")}
                    </FieldLabel>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                    />
                    <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="content">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      {t("notifications.message.content")}
                    </FieldLabel>
                    <Textarea
                      id={field.name}
                      rows={4}
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                    />
                    <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                  </Field>
                )}
              </form.Field>
            </FieldGroup>
          </FieldSet>
        </Card>

        <Card className="p-6">
          <FieldSet>
            <FieldLegend>{t("notifications.metadata.title")}</FieldLegend>
            <FieldDescription>{t("notifications.metadata.description")}</FieldDescription>
            <FieldGroup>
              <form.Field name="metadata.priority">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      {t("notifications.metadata.priority")}
                    </FieldLabel>
                    <Select
                      value={field.state.value ?? "none"}
                      onValueChange={(value) =>
                        field.handleChange(value as FormValues["metadata"]["priority"])
                      }
                    >
                      <SelectTrigger id={field.name}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          {t("notifications.metadata.none")}
                        </SelectItem>
                        {priorityOptions.map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {priority}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </form.Field>

              <form.Field name="metadata.expiresAt">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      {t("notifications.metadata.expires_at")}
                    </FieldLabel>
                    <Input
                      id={field.name}
                      type="datetime-local"
                      value={field.state.value ?? ""}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                    />
                    <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="metadata.actionGroupVariant">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      {t("notifications.metadata.action_group_variant")}
                    </FieldLabel>
                    <Select
                      value={field.state.value ?? "none"}
                      onValueChange={(value) =>
                        field.handleChange(
                          value as FormValues["metadata"]["actionGroupVariant"],
                        )
                      }
                    >
                      <SelectTrigger id={field.name}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          {t("notifications.metadata.none")}
                        </SelectItem>
                        {actionVariants.map((variant) => (
                          <SelectItem key={variant} value={variant}>
                            {variant}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </form.Field>

              <form.Field name="metadata.dataJson">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      {t("notifications.metadata.data_json")}
                    </FieldLabel>
                    <Textarea
                      id={field.name}
                      rows={4}
                      placeholder={t("notifications.metadata.data_json_placeholder")}
                      value={field.state.value ?? ""}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                    />
                    <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                  </Field>
                )}
              </form.Field>
            </FieldGroup>
          </FieldSet>
        </Card>

        <Card className="p-6">
          <FieldSet>
            <FieldLegend>{t("notifications.actions.title")}</FieldLegend>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <FieldDescription>
                {t("notifications.actions.description")}
              </FieldDescription>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  form.setFieldValue("metadata.actions", [
                    ...form.state.values.metadata.actions,
                    createAction(),
                  ])
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("notifications.actions.add")}
              </Button>
            </div>

            <FieldGroup>
              <form.Field name="metadata.actions" mode="array">
                {(field) => (
                  <div className="flex flex-col gap-4">
                    {field.state.value.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                        {t("notifications.actions.empty")}
                      </div>
                    ) : (
                      field.state.value.map((action, index) => (
                        <div
                          key={action.uid}
                          className="rounded-xl border border-border/70 bg-muted/10 p-4"
                        >
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">
                              {t("notifications.actions.action_label", {
                                index: index + 1,
                              })}
                            </Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => field.removeValue(index)}
                              aria-label={t("notifications.actions.remove")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <form.Field name={`metadata.actions[${index}].actionId`}>
                              {(actionField) => (
                                <Field>
                                  <FieldLabel htmlFor={actionField.name}>
                                    {t("notifications.actions.action_id")}
                                  </FieldLabel>
                                  <Input
                                    id={actionField.name}
                                    value={actionField.state.value}
                                    onChange={(event) =>
                                      actionField.handleChange(event.target.value)
                                    }
                                    onBlur={actionField.handleBlur}
                                  />
                                  <FieldError
                                    errors={toFieldErrors(actionField.state.meta.errors)}
                                  />
                                </Field>
                              )}
                            </form.Field>

                            <form.Field name={`metadata.actions[${index}].label`}>
                              {(actionField) => (
                                <Field>
                                  <FieldLabel htmlFor={actionField.name}>
                                    {t("notifications.actions.label")}
                                  </FieldLabel>
                                  <Input
                                    id={actionField.name}
                                    value={actionField.state.value}
                                    onChange={(event) =>
                                      actionField.handleChange(event.target.value)
                                    }
                                    onBlur={actionField.handleBlur}
                                  />
                                  <FieldError
                                    errors={toFieldErrors(actionField.state.meta.errors)}
                                  />
                                </Field>
                              )}
                            </form.Field>

                            <form.Field name={`metadata.actions[${index}].url`}>
                              {(actionField) => (
                                <Field>
                                  <FieldLabel htmlFor={actionField.name}>
                                    {t("notifications.actions.url")}
                                  </FieldLabel>
                                  <Input
                                    id={actionField.name}
                                    value={actionField.state.value}
                                    onChange={(event) =>
                                      actionField.handleChange(event.target.value)
                                    }
                                    onBlur={actionField.handleBlur}
                                  />
                                  <FieldError
                                    errors={toFieldErrors(actionField.state.meta.errors)}
                                  />
                                </Field>
                              )}
                            </form.Field>

                            <form.Field name={`metadata.actions[${index}].variant`}>
                              {(actionField) => (
                                <Field>
                                  <FieldLabel htmlFor={actionField.name}>
                                    {t("notifications.actions.variant")}
                                  </FieldLabel>
                                  <Select
                                    value={actionField.state.value ?? "none"}
                                    onValueChange={(value) =>
                                      actionField.handleChange(
                                        value === "none"
                                          ? undefined
                                          : (value as (typeof actionVariants)[number]),
                                      )
                                    }
                                  >
                                    <SelectTrigger id={actionField.name}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">
                                        {t("notifications.metadata.none")}
                                      </SelectItem>
                                      {actionVariants.map((variant) => (
                                        <SelectItem key={variant} value={variant}>
                                          {variant}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </Field>
                              )}
                            </form.Field>

                            <form.Field name={`metadata.actions[${index}].openInNewTab`}>
                              {(actionField) => (
                                <Field>
                                  <div className="flex items-center gap-3 text-sm">
                                    <Input
                                      id={actionField.name}
                                      type="checkbox"
                                      checked={actionField.state.value}
                                      onChange={(event) =>
                                        actionField.handleChange(event.target.checked)
                                      }
                                      onBlur={actionField.handleBlur}
                                      className="h-4 w-4"
                                    />
                                    <FieldLabel
                                      htmlFor={actionField.name}
                                      className="font-normal"
                                    >
                                      {t("notifications.actions.open_in_new_tab")}
                                    </FieldLabel>
                                  </div>
                                </Field>
                              )}
                            </form.Field>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </form.Field>
            </FieldGroup>
          </FieldSet>
        </Card>

        <Card className="p-6">
          <FieldSet>
            <FieldLegend>{t("notifications.delivery.title")}</FieldLegend>
            <FieldDescription>{t("notifications.delivery.description")}</FieldDescription>
            <FieldGroup>
              <form.Field name="delivery.immediate">
                {(field) => (
                  <Field>
                    <div className="flex items-center gap-3 text-sm">
                      <Input
                        id={field.name}
                        type="checkbox"
                        checked={field.state.value}
                        onChange={(event) => field.handleChange(event.target.checked)}
                        onBlur={field.handleBlur}
                        className="h-4 w-4"
                      />
                      <FieldLabel htmlFor={field.name} className="font-normal">
                        {t("notifications.delivery.immediate")}
                      </FieldLabel>
                    </div>
                  </Field>
                )}
              </form.Field>

              <form.Field name="delivery.strategies">
                {(field) => (
                  <Field>
                    <FieldLabel>{t("notifications.delivery.strategies")}</FieldLabel>
                    <div className="grid gap-2 md:grid-cols-2">
                      {deliveryStrategies.map((strategy) => {
                        const checked = field.state.value.includes(strategy);
                        return (
                          <label
                            key={strategy}
                            className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm"
                          >
                            <Input
                              type="checkbox"
                              checked={checked}
                              onChange={(event) => {
                                if (event.target.checked) {
                                  field.handleChange([...field.state.value, strategy]);
                                } else {
                                  field.handleChange(
                                    field.state.value.filter(
                                      (entry) => entry !== strategy,
                                    ),
                                  );
                                }
                              }}
                              onBlur={field.handleBlur}
                              className="h-4 w-4"
                            />
                            {strategy}
                          </label>
                        );
                      })}
                    </div>
                  </Field>
                )}
              </form.Field>
            </FieldGroup>
          </FieldSet>
        </Card>

        <Card className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                {t("notifications.submit_summary")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("notifications.submit_helper")}
              </p>
            </div>
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting
                    ? t("notifications.submit_loading")
                    : t("notifications.submit")}
                </Button>
              )}
            </form.Subscribe>
          </div>
          {sendMutation.isError && (
            <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {sendMutation.error instanceof Error
                ? sendMutation.error.message
                : t("notifications.send_error")}
            </div>
          )}
        </Card>
      </form>
    </div>
  );
}
