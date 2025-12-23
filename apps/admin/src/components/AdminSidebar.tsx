import { APP_NAME } from "@/app.config";
import { signOut, useSession } from "@/lib/auth-client";
import { Button } from "frontend-common/components/ui";
import {
  ArrowLeftFromLine,
  LayoutDashboard,
  LogOut,
  ShieldBan,
  Users,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";
import { LanguageSelector } from "./LanguageSelector";
import { ModeToggle } from "./theme-toggle";

const navItems = [
  { path: "/", icon: LayoutDashboard, labelKey: "navigation.dashboard" },
  {
    path: "/users",
    icon: Users,
    labelKey: "navigation.users",
    children: [
      {
        path: "/users/banned",
        icon: ShieldBan,
        labelKey: "navigation.banned_users",
      },
    ],
  },
];

type AdminSidebarProps = {
  className?: string;
  onClose?: () => void;
  onNavigate?: () => void;
  showCloseButton?: boolean;
};

export const AdminSidebar = ({
  className,
  onClose,
  onNavigate,
  showCloseButton = false,
}: AdminSidebarProps) => {
  const { t } = useTranslation("admin");
  const { data: session } = useSession();
  const frontendUrl = import.meta.env.VITE_FRONTEND_URL;

  return (
    <div
      className={`flex h-full lg:h-screen w-64 flex-col bg-sidebar border-r border-sidebar-border ${className || ""}`}
    >
      {/* Logo/Branding */}
      <div className="p-6 border-b border-sidebar-border flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-sidebar-foreground">{APP_NAME}</h1>
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md border border-sidebar-border p-2 text-sidebar-foreground lg:hidden"
            aria-label={t("navigation.close_menu", "Close navigation")}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <div key={item.path} className="space-y-1">
            <NavLink
              to={item.path}
              end
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{t(item.labelKey)}</span>
            </NavLink>
            {item.children?.map((child) => (
              <NavLink
                key={child.path}
                to={child.path}
                end
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ml-6 ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }`
                }
              >
                <child.icon className="h-5 w-5" />
                <span>{t(child.labelKey)}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User Info & Actions */}
      <div className="p-4 border-t border-sidebar-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-sidebar-foreground truncate">
            {session?.user?.email}
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <ModeToggle />
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="w-full">
          <a
            href={frontendUrl}
            onClick={() => onNavigate?.()}
            className="flex items-center gap-2"
          >
            <ArrowLeftFromLine className="h-4 w-4" />
            {t("navigation.frontend_app", "Back to App")}
          </a>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onNavigate?.();
            signOut();
          }}
          className="w-full flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          {t("sign_out", "Sign Out")}
        </Button>
      </div>
    </div>
  );
};
