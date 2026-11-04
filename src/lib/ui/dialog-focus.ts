import type { KeyboardEvent } from "react";

/** Keep Tab within the active dialog, including the final-to-first transition. */
export function trapDialogFocus(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== "Tab" || (event.target as HTMLElement).closest("dialog") !== event.currentTarget) return;
  const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')).filter(el => el.getClientRects().length > 0 && !el.closest("[inert]"));
  if (!items.length) { event.preventDefault(); return; }
  const first = items[0], last = items[items.length - 1], active = document.activeElement;
  if (event.shiftKey && (active === first || !event.currentTarget.contains(active))) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && (active === last || !event.currentTarget.contains(active))) { event.preventDefault(); first.focus(); }
}
