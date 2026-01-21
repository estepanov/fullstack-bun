export const getInitials = (value?: string | null, fallback = "U") => {
  if (!value) return fallback;

  const initials = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 2);

  return initials || fallback;
};
