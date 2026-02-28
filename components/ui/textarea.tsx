import * as React from "react";

import { cn } from "@/lib/utils/cn";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return <textarea className={cn("min-h-[80px] w-full rounded-md border p-3 text-sm", className)} ref={ref} {...props} />;
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
