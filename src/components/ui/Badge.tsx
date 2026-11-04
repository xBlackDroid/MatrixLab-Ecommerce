import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger" | "accent";
const tones: Record<BadgeTone, string> = { neutral: "border-ui-border bg-ui-surface text-ui-text-muted", info: "border-ui-info/40 bg-ui-info/10 text-ui-info", success: "border-ui-success/40 bg-ui-success/10 text-ui-success", warning: "border-ui-warning/40 bg-ui-warning/10 text-ui-warning", danger: "border-ui-danger/40 bg-ui-danger/10 text-ui-danger", accent: "border-ui-accent/40 bg-ui-accent/10 text-ui-accent" };
export default function Badge({ tone = "neutral", children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) { return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", tones[tone], className)}>{children}</span>; }
