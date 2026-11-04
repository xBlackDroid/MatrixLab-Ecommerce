"use client";
import { useEffect, useId, useRef, useState, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { controlClass } from "./Field";

export default function CountedTextarea({ className, maxLength, onInput, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { maxLength: number }) {
  const ref = useRef<HTMLTextAreaElement>(null), countId = useId();
  const [count, setCount] = useState(String(props.value ?? props.defaultValue ?? "").length);
  useEffect(() => { const node = ref.current, form = node?.form; const reset = () => requestAnimationFrame(() => setCount(node?.value.length ?? 0)); form?.addEventListener("reset", reset); return () => form?.removeEventListener("reset", reset); }, []);
  return <><textarea {...props} ref={ref} maxLength={maxLength} aria-describedby={[props["aria-describedby"], countId].filter(Boolean).join(" ")} className={cn(controlClass, className)} onInput={event => { setCount(event.currentTarget.value.length); onInput?.(event); }} /><p id={countId} className="mt-1 text-xs text-ui-text-muted">{count} / {maxLength} caracteres</p></>;
}
