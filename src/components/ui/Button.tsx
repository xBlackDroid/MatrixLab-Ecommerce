import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export default function Button({ variant = "primary", className, busy, disabled, children, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger"; busy?: boolean }) {
  return <button {...props} type={type} disabled={disabled || busy} aria-busy={busy || undefined} className={cn("inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60", variant === "primary" ? "bg-ui-accent text-ui-on-accent hover:bg-ui-accent/90" : variant === "danger" ? "border border-ui-danger text-ui-danger hover:bg-ui-danger/10" : "border border-ui-control-border bg-transparent text-ui-text hover:bg-ui-surface-raised", className)}>{children}</button>;
}
