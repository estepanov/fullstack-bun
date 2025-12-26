type SocialAuthButtonProps = {
  label: string;
  loadingLabel?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  isLastUsed?: boolean;
  lastUsedLabel?: string;
  onClick: () => void;
};

export function SocialAuthButton({
  label,
  loadingLabel,
  isLoading = false,
  isDisabled = false,
  isLastUsed = false,
  lastUsedLabel,
  onClick,
}: SocialAuthButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled || isLoading}
      className={`cursor-pointer w-full rounded-full border-2 border-border/70 bg-background/50 px-4 py-2.5 text-center text-sm font-semibold text-foreground shadow-sm hover:bg-background hover:border-border focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        isLastUsed ? "bg-primary/10 border-primary/30" : ""
      }`}
    >
      <span className="flex items-center justify-center gap-2">
        {isLoading && loadingLabel ? loadingLabel : label}
        {isLastUsed && !isLoading && lastUsedLabel && (
          <span className="text-xs text-primary">{lastUsedLabel}</span>
        )}
      </span>
    </button>
  );
}
