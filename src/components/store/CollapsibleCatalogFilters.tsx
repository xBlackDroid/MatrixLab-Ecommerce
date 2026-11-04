"use client";

import { useRef, type ReactNode } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import styles from "./CollapsibleCatalogFilters.module.css";

/** Full filters remain unchanged on desktop; mobile starts with one closed control. */
export default function CollapsibleCatalogFilters({ children, selected, label = "Filtrar productos" }: { children: ReactNode; selected: string; label?: string }) {
  const details = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);
  const close = () => { if (details.current) details.current.open = false; summary.current?.focus(); };
  return <>
    <div className={styles.desktop}>{children}</div>
    <details ref={details} data-catalog-filter className={styles.mobile} onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); close(); } }}>
      <summary ref={summary} aria-label={`${label}: ${selected}`} className={styles.summary}><SlidersHorizontal aria-hidden /><span>Filtrar <span className={styles.selection}>· {selected}</span></span><ChevronDown aria-hidden className={styles.chevron} /></summary>
      <div className={styles.body} onClick={event => { if ((event.target as Element).closest('button:not(:disabled)')) close(); }}>{children}</div>
    </details>
  </>;
}
