import { cn } from "@/lib/utils";
import { Link as RouterLink } from "react-router";

export const Link = ({ to, ...props }: React.ComponentProps<typeof RouterLink>) => {
  return (
    <RouterLink
      to={to}
      className={cn(["text-primary underline-offset-4 underline"])}
      {...props}
    />
  );
};
