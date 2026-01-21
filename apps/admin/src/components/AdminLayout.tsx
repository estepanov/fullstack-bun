import { Button } from "frontend-common/components/ui";
import { useState } from "react";
import { Outlet } from "react-router";
import { AdminHeader } from "./AdminHeader";
import { AdminSidebar } from "./AdminSidebar";
import { DemoWelcomeModal } from "./DemoWelcomeModal";
import { isDemoMode } from "@admin/lib/demo";

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex lg:flex-row flex-col min-h-dvh">
      {isDemoMode ? <DemoWelcomeModal /> : null}
      <AdminSidebar className="hidden lg:flex" />
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <Button
            type="button"
            variant="ghost"
            className="absolute inset-0 bg-black/50 rounded-none hover:bg-black/50"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          />
          <AdminSidebar
            className="absolute left-0 top-0 h-full w-72 shadow-xl"
            onClose={() => setSidebarOpen(false)}
            onNavigate={() => setSidebarOpen(false)}
            showCloseButton
          />
        </div>
      )}
      <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
      <div className="app-surface flex flex-1">
        <Outlet />
      </div>
    </div>
  );
};
