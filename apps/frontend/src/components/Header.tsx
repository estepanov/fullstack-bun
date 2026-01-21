import { signOut, useSession } from "@frontend/lib/auth-client";
import { PopoverClose } from "@radix-ui/react-popover";
import { isAdminSession } from "frontend-common/auth";
import { Button, Container, Separator, StyledLink } from "frontend-common/components/ui";
import { Popover, PopoverContent, PopoverTrigger } from "frontend-common/components/ui";
import { cn } from "frontend-common/lib";
import { MenuIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink, NavLink as RouterNavLink } from "react-router";
import { NotificationBell } from "./notifications/NotificationBell";

const NavLink = ({
  to,
  children,
  ...props
}: { to: string; children: React.ReactNode } & React.ComponentProps<
  typeof RouterNavLink
>) => {
  return (
    <RouterNavLink
      to={to}
      className={({ isActive, isPending }) =>
        cn([isPending ? "text-muted-foreground" : "", isActive ? "underline" : ""])
      }
      {...props}
    >
      {children}
    </RouterNavLink>
  );
};
const MobileNavigation = () => {
  const { t } = useTranslation("header");
  const { data: session } = useSession();
  const isAdmin = isAdminSession(session);

  return (
    <Popover>
      <PopoverTrigger
        className="relative z-10 flex h-8 w-8 items-center justify-center focus:not-data-focus:outline-hidden"
        aria-label={t("mobile_nav_icon_label")}
      >
        <MenuIcon />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="left"
        sideOffset={260}
        className="absolute inset-x-0 top-full mt-4 flex origin-top flex-col rounded-2xl bg-white dark:bg-gray-800 p-4 text-lg tracking-tight text-slate-900 dark:text-gray-100 shadow-xl dark:shadow-gray-900/50 ring-1 ring-slate-900/5 dark:ring-gray-700/50 data-closed:scale-95 data-closed:opacity-0 data-enter:duration-150 data-enter:ease-out data-leave:duration-100 data-leave:ease-in"
      >
        <PopoverClose asChild>
          <NavLink to="/more">{t("nav_links.second_page")}</NavLink>
        </PopoverClose>
        {session && (
          <PopoverClose asChild>
            <NavLink to="/dashboard">Dashboard</NavLink>
          </PopoverClose>
        )}
        {isAdmin && (
          <a
            href={import.meta.env.VITE_ADMIN_URL || "http://localhost:5175"}
            className="hover:underline"
          >
            Admin
          </a>
        )}
        <Separator className="my-2" />
        {session ? (
          <div className="flex flex-col gap-2">
            <span>{session.user.email}</span>
            <Button type="button" onClick={() => signOut()} variant="destructive">
              Sign Out
            </Button>
          </div>
        ) : (
          <PopoverClose asChild>
            <StyledLink size="md" variant="default-button" to="/auth/login">
              {t("nav_links.sign_in")}
            </StyledLink>
          </PopoverClose>
        )}
      </PopoverContent>
    </Popover>
  );
};

export const Header = () => {
  const { t } = useTranslation("header");
  const { data: session } = useSession();
  const isAdmin = isAdminSession(session);

  return (
    <header className="py-4 bg-accent">
      <Container>
        <nav className="relative z-50 flex justify-between">
          <div className="flex items-center md:gap-x-12">
            <RouterLink
              to="/"
              aria-label={t("app_name_home_link")}
              className="text-lg font-bold"
            >
              {t("app_name")}
            </RouterLink>
            <div className="hidden md:flex md:gap-x-6">
              <NavLink to="/more">{t("nav_links.second_page")}</NavLink>
              {session && <NavLink to="/dashboard">Dashboard</NavLink>}
              {isAdmin && (
                <a
                  href={import.meta.env.VITE_ADMIN_URL || "http://localhost:5175"}
                  className="hover:underline"
                >
                  Admin
                </a>
              )}
            </div>
          </div>
          <div className="flex items-center gap-x-2">
            {session ? (
              <div className="hidden md:flex md:items-center md:gap-x-4">
                <span>{session.user.email}</span>
                <Button
                  type="button"
                  onClick={() => signOut()}
                  variant="link"
                  className="text-destructive"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <StyledLink variant="default-button" to="/auth/login">
                {t("nav_links.sign_in")}
              </StyledLink>
            )}
            {session && <NotificationBell />}
            <div className="-mr-1 md:hidden">
              <MobileNavigation />
            </div>
          </div>
        </nav>
      </Container>
    </header>
  );
};
