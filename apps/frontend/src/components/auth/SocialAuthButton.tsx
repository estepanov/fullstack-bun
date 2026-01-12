import { Button } from "frontend-common/components/ui";
import { LastUsedBadge } from "./LastUsedBadge";

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
    <Button
      type="button"
      onClick={onClick}
      disabled={isDisabled || isLoading}
      className="w-full"
      variant={isLastUsed ? "default" : "outline"}
    >
      <span className="flex items-center justify-center gap-2">
        {isLoading && loadingLabel ? loadingLabel : label}
        {isLastUsed && !isLoading && lastUsedLabel && (
          <LastUsedBadge label={lastUsedLabel} />
        )}
      </span>
    </Button>
  );
}
