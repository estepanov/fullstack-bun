import type { ReactNode } from "react";
import { cn } from "frontend-common/lib";

type AppSurfaceCenterProps = {
  children: ReactNode;
  className?: string;
};

export const AppSurfaceCenter = ({
  children,
  className,
}: AppSurfaceCenterProps) => {
  return (
    <div
      className={cn(
        "app-surface flex items-center justify-center px-4 py-10",
        className,
      )}
    >
      {children}
    </div>
  );
};
