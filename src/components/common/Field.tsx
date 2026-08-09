import { cloneElement, isValidElement } from "react";
import type { InputHTMLAttributes, LabelHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const controlClasses =
  "w-full rounded-md border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:bg-muted";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("block text-xs font-medium text-foreground", className)} {...props} />
  );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClasses, "h-10", className)} {...props} />;
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlClasses, "min-h-24 py-2 leading-relaxed", className)} {...props} />;
}

export function SelectInput({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlClasses, "h-10", className)} {...props}>
      {children}
    </select>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  const describedBy = [hint ? `${htmlFor}-hint` : null, error ? `${htmlFor}-error` : null]
    .filter(Boolean)
    .join(" ");

  // Wire the hint/error text to the control so screen readers announce it,
  // rather than relying on visual proximity alone.
  const typedChild = isValidElement<{ "aria-describedby"?: string; "aria-invalid"?: boolean }>(
    children,
  )
    ? children
    : null;
  const control =
    describedBy && typedChild
      ? cloneElement(typedChild, {
          "aria-describedby": [typedChild.props["aria-describedby"], describedBy]
            .filter(Boolean)
            .join(" "),
          ...(error ? { "aria-invalid": true } : {}),
        })
      : children;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {control}
      {hint ? (
        <p id={`${htmlFor}-hint`} className="text-meta">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs font-medium text-negative-foreground">
          {error}
        </p>
      ) : null}
    </div>
  );
}
