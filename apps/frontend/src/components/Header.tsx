import { Container } from "@/components/ui/container";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { RowsIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink, NavLink as RouterNavLink } from "react-router";

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
  return (
    <Popover>
      <PopoverTrigger
        className="relative z-10 flex h-8 w-8 items-center justify-center focus:not-data-focus:outline-hidden"
        aria-label={t("mobile_nav_icon_label")}
      >
        <RowsIcon />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="left"
        sideOffset={260}
        className="absolute inset-x-0 top-full mt-4 flex origin-top flex-col rounded-2xl bg-white p-4 text-lg tracking-tight text-slate-900 shadow-xl ring-1 ring-slate-900/5 data-closed:scale-95 data-closed:opacity-0 data-enter:duration-150 data-enter:ease-out data-leave:duration-100 data-leave:ease-in"
      >
        <NavLink to="/more">{t("nav_links.second_page")}</NavLink>
        <hr className="m-2 border-slate-300/40" />
        <NavLink to="/login">{t("nav_links.sign_in")}</NavLink>
      </PopoverContent>
    </Popover>
  );
};

export const Header = () => {
  const { t } = useTranslation("header");
  return (
    <header className="py-4 bg-accent/70">
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
            </div>
          </div>
          <div className="flex items-center gap-x-5 md:gap-x-8">
            <div className="hidden md:block">
              <NavLink to="/login">{t("nav_links.sign_in")}</NavLink>
            </div>
            <div className="-mr-1 md:hidden">
              <MobileNavigation />
            </div>
          </div>
        </nav>
      </Container>
    </header>
  );
};
