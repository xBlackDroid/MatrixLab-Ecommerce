import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** A surface role; choose density independently from the business content. */
export default function Card({ as: Element = "section", density = "comfortable", className, ...props }: HTMLAttributes<HTMLElement> & { as?: "section" | "aside" | "article" | "div"; density?: "comfortable" | "compact" }) {
  return <Element {...props} data-density={density} className={cn("rounded-xl border border-ui-border bg-ui-surface", density === "compact" ? "p-4" : "p-6", className)} />;
}
