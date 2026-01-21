import { apiClient } from "@admin/lib/api-client";
import { useMutation } from "@tanstack/react-query";
import type { AdminSendNotificationRequest } from "shared/interfaces/notification";
import { ADMIN_NOTIFICATIONS_SEND_MUTATION_KEY } from "./query-key";

type ValidationIssue = { message?: string };

const hasValidationIssues = (value: unknown): value is { issues: ValidationIssue[] } => {
  return (
    typeof value === "object" &&
    value !== null &&
    "issues" in value &&
    Array.isArray((value as { issues?: unknown }).issues)
  );
};

const extractErrorMessage = (value: unknown): string | undefined => {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  if ("error" in value && typeof (value as { error?: unknown }).error === "string") {
    return (value as { error: string }).error;
  }

  return undefined;
};

export const useAdminSendNotificationMutation = () =>
  useMutation({
    mutationKey: [ADMIN_NOTIFICATIONS_SEND_MUTATION_KEY],
    mutationFn: async (payload: AdminSendNotificationRequest) => {
      const response = await apiClient.admin.notifications.send.$post({
        json: payload,
      });

      if (!response.ok) {
        const errorPayload: unknown = await response.json().catch(() => ({}));

        // If there are validation issues, extract just the messages
        if (hasValidationIssues(errorPayload)) {
          const messages = errorPayload.issues
            .map((issue) => issue.message)
            .filter(Boolean)
            .join(", ");
          throw new Error(messages || "Validation failed");
        }

        throw new Error(
          extractErrorMessage(errorPayload) ?? "Failed to send notification",
        );
      }

      return response.json();
    },
  });
