type SocialAuthButtonProps = {
  label: string;
  loadingLabel?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  onClick: () => void;
};

export function SocialAuthButton({
  label,
  loadingLabel,
  isLoading = false,
  isDisabled = false,
  onClick,
}: SocialAuthButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled || isLoading}
      className="w-full rounded-full border-2 border-border/70 bg-background/50 px-4 py-2.5 text-center text-sm font-semibold text-foreground shadow-sm hover:bg-background hover:border-border focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors disabled:opacity-50"
    >
      {isLoading && loadingLabel ? loadingLabel : label}
    </button>
  );
}
