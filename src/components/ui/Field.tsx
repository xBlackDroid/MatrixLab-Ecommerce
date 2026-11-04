import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const controlClass = "w-full min-h-11 rounded-md border border-ui-control-border bg-ui-surface px-3 py-2 text-base text-ui-text placeholder:text-ui-text-muted disabled:opacity-60";
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) { return <input {...props} className={cn(controlClass, className)} />; }
export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) { return <select {...props} className={cn(controlClass, className)} />; }
export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea {...props} className={cn(controlClass, "min-h-24", className)} />; }
export default function Field({ id, label, help, error, children }: { id: string; label: string; help?: string; error?: string; children: ReactNode }) {
  return <div className="grid gap-1.5"><label htmlFor={id} className="text-sm font-medium text-ui-text">{label}</label>{children}{help && <p id={`${id}-help`} className="text-sm text-ui-text-muted">{help}</p>}{error && <p id={`${id}-error`} className="text-sm text-ui-danger">{error}</p>}</div>;
}
