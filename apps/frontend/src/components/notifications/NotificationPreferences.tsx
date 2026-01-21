import { useGetNotificationPreferencesQuery } from "@frontend/hooks/api/useGetNotificationPreferencesQuery";
import { useUpdateNotificationPreferencesMutation } from "@frontend/hooks/api/useUpdateNotificationPreferencesMutation";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Field,
  FieldLabel,
  Input,
  Label,
} from "frontend-common/components/ui";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  DEFAULT_EMAIL_TYPES,
  DEFAULT_PUSH_TYPES,
  DELIVERY_STRATEGY_PRIORITY,
} from "shared/config/notification";
import { type DeliveryStrategy, NotificationType } from "shared/interfaces/notification";
import { toast } from "sonner";

const toNotificationTypes = (values: readonly string[]): NotificationType[] =>
  values
    .map((value) =>
      Object.values(NotificationType).includes(value as NotificationType)
        ? (value as NotificationType)
        : null,
    )
    .filter((value): value is NotificationType => value !== null);

const SUPPORTED_EMAIL_TYPES = toNotificationTypes(DEFAULT_EMAIL_TYPES);
const SUPPORTED_PUSH_TYPES = toNotificationTypes(DEFAULT_PUSH_TYPES);

const DELIVERY_STRATEGIES = DELIVERY_STRATEGY_PRIORITY as readonly DeliveryStrategy[];

const SUPPORTED_EMAIL_TYPE_SET = new Set<NotificationType>(SUPPORTED_EMAIL_TYPES);
const SUPPORTED_PUSH_TYPE_SET = new Set<NotificationType>(SUPPORTED_PUSH_TYPES);

const normalizeTypes = (types: NotificationType[]) => [...types].sort();

const areTypeSetsEqual = (a: NotificationType[], b: NotificationType[]) =>
  JSON.stringify(normalizeTypes(a)) === JSON.stringify(normalizeTypes(b));

export const NotificationPreferences = () => {
  const { t } = useTranslation("notifications");
  const { data, isLoading } = useGetNotificationPreferencesQuery();
  const updateMutation = useUpdateNotificationPreferencesMutation();
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [emailTypes, setEmailTypes] = useState<NotificationType[]>([]);
  const [pushTypes, setPushTypes] = useState<NotificationType[]>([]);
  const pushSupported =
    SUPPORTED_PUSH_TYPES.length > 0 && DELIVERY_STRATEGIES.includes("push");

  const rawPreferences =
    data?.success && "preferences" in data && data.preferences
      ? data.preferences
      : undefined;

  const preferences = useMemo(() => {
    if (!rawPreferences) {
      return undefined;
    }

    return {
      ...rawPreferences,
      emailTypes: rawPreferences.emailTypes.filter((type) =>
        SUPPORTED_EMAIL_TYPE_SET.has(type),
      ),
      pushTypes: rawPreferences.pushTypes.filter((type) =>
        SUPPORTED_PUSH_TYPE_SET.has(type),
      ),
    };
  }, [rawPreferences]);

  useEffect(() => {
    if (preferences) {
      setEmailEnabled(preferences.emailEnabled);
      setPushEnabled(preferences.pushEnabled);
      setEmailTypes(preferences.emailTypes);
      setPushTypes(preferences.pushTypes);
    }
  }, [preferences]);

  const handleEmailTypeToggle = (type: NotificationType, checked: boolean) => {
    setEmailTypes((prev) => (checked ? [...prev, type] : prev.filter((t) => t !== type)));
  };

  const handlePushTypeToggle = (type: NotificationType, checked: boolean) => {
    setPushTypes((prev) => (checked ? [...prev, type] : prev.filter((t) => t !== type)));
  };

  const handleSave = () => {
    updateMutation.mutate(
      {
        emailEnabled,
        pushEnabled,
        emailTypes,
        pushTypes,
      },
      {
        onSuccess: () => {
          toast.success(t("preferences.status.success"));
        },
        onError: () => {
          toast.error(t("preferences.status.error"));
        },
      },
    );
  };

  const hasChanges = Boolean(
    preferences &&
      (emailEnabled !== preferences.emailEnabled ||
        !areTypeSetsEqual(emailTypes, preferences.emailTypes) ||
        (pushSupported &&
          (pushEnabled !== preferences.pushEnabled ||
            !areTypeSetsEqual(pushTypes, preferences.pushTypes)))),
  );

  const getTypeLabel = (type: NotificationType) => t(`preferences.types.${type}`);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {t("preferences.loading")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="space-y-2 bg-card text-card-foreground">
      <CardHeader className="gap-1.5">
        <CardTitle className="text-lg font-semibold">{t("preferences.title")}</CardTitle>
        <CardDescription>{t("preferences.description")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 px-6">
        <section className="space-y-4 rounded-2xl border border-border/60 bg-background/40 px-5 py-4 shadow-sm shadow-black/5">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-enabled">{t("preferences.email.label")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("preferences.email.description")}
              </p>
            </div>
            <input
              type="checkbox"
              id="email-enabled"
              checked={emailEnabled}
              onChange={(event) => setEmailEnabled(event.target.checked)}
              className="h-5 w-5 rounded border-border bg-background text-primary focus:ring-primary"
            />
          </div>

          {emailEnabled && (
            <div className="ml-4 space-y-3">
              <p className="text-sm font-medium text-foreground">
                {t("preferences.email.types_title")}
              </p>
              <div className="space-y-2">
                {SUPPORTED_EMAIL_TYPES.map((type) => (
                  <Field key={type} orientation="horizontal">
                    <Input
                      type="checkbox"
                      id={`email-${type}`}
                      checked={emailTypes.includes(type)}
                      onChange={(event) =>
                        handleEmailTypeToggle(type, event.target.checked)
                      }
                    />
                    <FieldLabel htmlFor={`email-${type}`}>
                      {getTypeLabel(type)}
                    </FieldLabel>
                  </Field>
                ))}
              </div>
            </div>
          )}
        </section>

        {pushSupported && (
          <section className="space-y-4 rounded-2xl border border-border/60 bg-background/40 px-5 py-4 shadow-sm shadow-black/5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-enabled">
                  {t("preferences.push.label", "Push Notifications")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t(
                    "preferences.push.description",
                    "Receive push notifications in your browser.",
                  )}
                </p>
              </div>
              <input
                type="checkbox"
                id="push-enabled"
                checked={pushEnabled}
                onChange={(event) => setPushEnabled(event.target.checked)}
                className="h-5 w-5 rounded border-border bg-background text-primary focus:ring-primary"
              />
            </div>

            {pushEnabled && (
              <div className="ml-4 space-y-3">
                <p className="text-sm font-medium text-foreground">
                  {t("preferences.push.types_title", "Receive push notifications for:")}
                </p>
                <div className="space-y-2">
                  {SUPPORTED_PUSH_TYPES.map((type) => (
                    <Field key={type} orientation="horizontal">
                      <Input
                        type="checkbox"
                        id={`push-${type}`}
                        checked={pushTypes.includes(type)}
                        onChange={(event) =>
                          handlePushTypeToggle(type, event.target.checked)
                        }
                      />
                      <FieldLabel htmlFor={`push-${type}`}>
                        {getTypeLabel(type)}
                      </FieldLabel>
                    </Field>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </CardContent>

      {hasChanges && (
        <CardFooter className="flex flex-col gap-3 px-6 sm:flex-row sm:items-center sm:justify-between">
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="min-w-[150px] justify-center"
          >
            {updateMutation.isPending
              ? t("preferences.actions.saving")
              : t("preferences.actions.save")}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
