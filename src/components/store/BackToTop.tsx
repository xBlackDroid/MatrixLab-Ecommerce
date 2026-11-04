"use client";

import { ArrowUp } from "lucide-react";

export default function BackToTop({ inNavigation = false }: { inNavigation?: boolean }) {
  return <button type="button" className={inNavigation ? "store-back-to-top-navigation" : "store-back-to-top"} onClick={() => {
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }}><ArrowUp aria-hidden className="h-4 w-4" />Volver arriba</button>;
}
