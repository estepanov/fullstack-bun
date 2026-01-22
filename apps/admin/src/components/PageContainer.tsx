import { cn } from "frontend-common/lib";

export const PageContainer = ({
  children,
  className,
}: { children: React.ReactNode; className?: string }) => {
  return (
    <div
      className={cn(
        "mx-auto max-w-6xl w-full px-4 py-10 sm:px-6 lg:px-8 h-full lg:h-screen overflow-scroll",
        className,
      )}
    >
      {children}
    </div>
  );
};
