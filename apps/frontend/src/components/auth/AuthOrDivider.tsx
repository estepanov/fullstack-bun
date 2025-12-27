import { useTranslation } from "react-i18next";

type AuthOrDividerProps = {
  className?: string;
};

export function AuthOrDivider({ className = "" }: AuthOrDividerProps) {
  const { t } = useTranslation("auth");
  const containerClassName = className ? `relative ${className}` : "relative";

  return (
    <div className={containerClassName}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border/50" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card px-2 text-muted-foreground">
          {t("common.or")}
        </span>
      </div>
    </div>
  );
}
