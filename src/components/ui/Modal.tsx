"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { trapDialogFocus } from "@/lib/ui/dialog-focus";

export default function Modal({ title, onClose, busy = false, children }: { title: string; onClose: () => void; busy?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const node = ref.current; const trigger = document.activeElement as HTMLElement; if (node && !node.open) { node.showModal(); (node.querySelector<HTMLElement>("input:not([type=hidden]),select,textarea") ?? node.querySelector<HTMLElement>("button"))?.focus(); } return () => { if (node?.open) node.close(); if (trigger?.isConnected) trigger.focus(); }; }, []);
  return <dialog ref={ref} aria-label={title} className="ui-dialog w-[min(1000px,calc(100vw-32px))] p-0" onKeyDown={trapDialogFocus} onCancel={e => { e.preventDefault(); if (!busy) onClose(); }}>{children}</dialog>;
}
