import * as React from "react";

import { cn } from "@/lib/utils/cn";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, ...props }, ref) => {
  return <input className={cn("h-9 w-full rounded-md border px-3 py-1 text-sm", className)} ref={ref} {...props} />;
});
Input.displayName = "Input";

export { Input };
