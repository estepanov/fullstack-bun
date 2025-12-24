import { useState } from "react";
import { Outlet } from "react-router";
import { AdminHeader } from "./AdminHeader";
import { AdminSidebar } from "./AdminSidebar";

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar className="hidden lg:flex" />
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
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
      <main className="flex-1 flex min-h-0 flex-col overflow-y-auto bg-gray-50 dark:bg-gray-950">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
