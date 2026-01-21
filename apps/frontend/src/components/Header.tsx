import { signOut, useSession } from "@frontend/lib/auth-client";
import { getInitials } from "@frontend/lib/getInitials";
import { PopoverClose } from "@radix-ui/react-popover";
import { isAdminSession } from "frontend-common/auth";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Container,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
  StyledLink,
} from "frontend-common/components/ui";
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
            <NavLink to="/dashboard">{t("nav_links.dashboard")}</NavLink>
          </PopoverClose>
        )}
        {isAdmin && (
          <a
            href={import.meta.env.VITE_ADMIN_URL || "http://localhost:5175"}
            className="hover:underline"
          >
            {t("nav_links.admin")}
          </a>
        )}
        <Separator className="my-2" />
        {session ? (
          <div className="flex flex-col gap-2">
            <span>{session.user.email}</span>
            <Button type="button" onClick={() => signOut()} variant="destructive">
              {t("user_menu.sign_out")}
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
  const userName = session?.user.name?.trim() || session?.user.email || "";
  const avatarAltName = userName || session?.user.email || t("user_menu.fallback_name");
  const avatarAlt = t("user_menu.avatar_alt", { name: avatarAltName });
  const avatarImage = session?.user.image;
  const userInitials = getInitials(userName);

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
              {session && <NavLink to="/dashboard">{t("nav_links.dashboard")}</NavLink>}
              {isAdmin && (
                <a
                  href={import.meta.env.VITE_ADMIN_URL || "http://localhost:5175"}
                  className="hover:underline"
                >
                  {t("nav_links.admin")}
                </a>
              )}
            </div>
          </div>
          <div className="flex items-center gap-x-2">
            {session && <NotificationBell />}
            {session ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="relative hidden h-10 w-10 p-0 md:inline-flex rounded-full"
                    aria-label={t("user_menu.open_label")}
                  >
                    <Avatar className="h-9 w-9 rounded-full">
                      {avatarImage ? (
                        <AvatarImage src={avatarImage} alt={avatarAlt} />
                      ) : null}
                      <AvatarFallback className="bg-transparent">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {avatarImage ? (
                        <AvatarImage src={avatarImage} alt={avatarAlt} />
                      ) : null}
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      {userName ? (
                        <p className="text-sm font-medium leading-tight truncate">
                          {userName}
                        </p>
                      ) : null}
                      <p className="text-xs text-muted-foreground leading-tight break-all">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex flex-col gap-2">
                    <StyledLink variant="ghost-button" size="sm" to="/dashboard">
                      {t("nav_links.dashboard")}
                    </StyledLink>
                    <Button
                      type="button"
                      onClick={() => signOut()}
                      variant="destructive"
                      size="sm"
                    >
                      {t("user_menu.sign_out")}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <StyledLink variant="default-button" to="/auth/login">
                {t("nav_links.sign_in")}
              </StyledLink>
            )}
            <div className="-mr-1 md:hidden">
              <MobileNavigation />
            </div>
          </div>
        </nav>
      </Container>
    </header>
  );
};
