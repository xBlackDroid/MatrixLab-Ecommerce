"use client";
import { useCallback, useSyncExternalStore, type Dispatch, type SetStateAction } from "react";
const eventName = "matrixlab:url-state";
/** Commit related filters as one navigation, so Back restores the previous view. */
export function updateUrlState(updates: Record<string, string | null>, mode: "push" | "replace" = "push") {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === "") url.searchParams.delete(key);
    else url.searchParams.set(key, value);
  }
  const target = `${url.pathname}${url.search}${url.hash}`;
  if (target === `${location.pathname}${location.search}${location.hash}`) return;
  window.history[mode === "replace" ? "replaceState" : "pushState"](null, "", target);
  window.dispatchEvent(new Event(eventName));
}
function subscribe(notify: () => void) { window.addEventListener("popstate", notify); window.addEventListener(eventName, notify); return () => { window.removeEventListener("popstate", notify); window.removeEventListener(eventName, notify); }; }
/** Native Next-compatible history preserves other parameters and restores with back/forward. */
export default function useUrlState<T extends string | null>(key: string, initial: T, allowed?: readonly string[], mode: "push" | "replace" = "push"): [T, Dispatch<SetStateAction<T>>] {
  const get = useCallback(() => { const value = new URLSearchParams(window.location.search).get(key); return value !== null && (!allowed || allowed.includes(value)) ? value as T : initial; }, [key, initial, allowed]);
  const value = useSyncExternalStore(subscribe, get, () => initial);
  const set = useCallback<Dispatch<SetStateAction<T>>>(next => { const current = get(); const resolved = typeof next === "function" ? next(current) : next; const url = new URL(window.location.href); if (resolved === null || resolved === initial) url.searchParams.delete(key); else url.searchParams.set(key, resolved); const target = `${url.pathname}${url.search}${url.hash}`; if (target === `${location.pathname}${location.search}${location.hash}`) return; window.history[mode === "replace" ? "replaceState" : "pushState"](null, "", target); window.dispatchEvent(new Event(eventName)); }, [get, initial, key, mode]);
  return [value, set];
}
