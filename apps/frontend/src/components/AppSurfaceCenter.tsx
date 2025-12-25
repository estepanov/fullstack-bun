import { cn } from "frontend-common/lib";
import type { ReactNode } from "react";

type AppSurfaceCenterProps = {
  children: ReactNode;
  className?: string;
};

export const AppSurfaceCenter = ({ children, className }: AppSurfaceCenterProps) => {
  return (
    <div
      className={cn(
        "app-surface flex flex-1 items-center justify-center px-4 py-10",
        className,
      )}
    >
      {children}
    </div>
  );
};
