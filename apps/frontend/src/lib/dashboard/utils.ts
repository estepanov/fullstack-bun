export const parseErrorMessage = (error: unknown, fallback: string): string => {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: string }).message;
    if (typeof message === "string" && message.trim() !== "") return message;
  }
  if (typeof error === "object" && error !== null && "error" in error) {
    const message = (error as { error?: unknown }).error;
    if (typeof message === "string" && message.trim() !== "") return message;
  }
  return fallback;
};

export const formatDateTime = (value?: string | Date | null): string => {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

export const formatProviderLabel = (providerId: string): string => {
  return providerId.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};
