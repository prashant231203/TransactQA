import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="mx-auto flex min-h-screen max-w-md items-center px-6">{children}</div>;
}
