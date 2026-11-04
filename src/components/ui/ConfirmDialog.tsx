"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import Button from "./Button";
import { trapDialogFocus } from "@/lib/ui/dialog-focus";

/** Review a consequence without defining or changing domain transitions. */
export default function ConfirmDialog({ open, title, children, onConfirm, onCancel, busy = false, confirmLabel = "Confirmar" }: { open: boolean; title: string; children: ReactNode; onConfirm: () => void; onCancel: () => void; busy?: boolean; confirmLabel?: string }) {
  const titleId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const onCancelRef = useRef(onCancel); onCancelRef.current = onCancel;
  useEffect(() => { const node = dialog.current; if (!node) return; if (open && !node.open) { returnFocus.current = document.activeElement as HTMLElement; node.showModal(); cancel.current?.focus(); } else if (!open && node.open) { node.close(); returnFocus.current?.focus(); } }, [open]);
  useEffect(() => () => { if (dialog.current?.open) dialog.current.close(); if (returnFocus.current?.isConnected) returnFocus.current.focus(); }, []);
  return <dialog ref={dialog} className="ui-dialog" aria-labelledby={titleId} onKeyDown={trapDialogFocus} onCancel={e => { e.preventDefault(); if (!busy) onCancelRef.current(); }}><h2 id={titleId} className="text-xl font-semibold">{title}</h2><div className="my-4 text-sm text-ui-text-muted">{children}</div><div className="flex flex-wrap justify-end gap-3"><button ref={cancel} type="button" disabled={busy} onClick={onCancel} className="min-h-11 rounded-md border border-ui-control-border px-4 py-2 text-sm font-semibold">Cancelar</button><Button busy={busy} onClick={onConfirm}>{busy ? "Confirmando…" : confirmLabel}</Button></div></dialog>;
}
