type LastUsedBadgeProps = {
  label: string;
};

export function LastUsedBadge({ label }: LastUsedBadgeProps) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-primary-foreground text-primary">
      {label}
    </span>
  );
}
