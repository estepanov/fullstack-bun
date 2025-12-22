import { Menu } from "lucide-react";
import { useTranslation } from "react-i18next";

type AdminHeaderProps = {
  onMenuClick?: () => void;
};

export const AdminHeader = ({ onMenuClick }: AdminHeaderProps) => {
  const { t } = useTranslation("admin");

  return (
    <header className="h-16 border-b border-border bg-background px-4 sm:px-6 flex items-center">
      <div className="flex items-center gap-3 flex-1">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex items-center justify-center rounded-md border border-border p-2 text-foreground lg:hidden"
          aria-label={t("navigation.open_menu", "Open navigation")}
        >
          <Menu className="h-5 w-5" />
        </button>
        {/* Breadcrumbs or page title can go here */}
        <h2 className="text-lg font-semibold text-foreground">
          {t("portal", "Admin Portal")}
        </h2>
      </div>
    </header>
  );
};
