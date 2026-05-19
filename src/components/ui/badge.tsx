import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "success" | "info" | "warning" | "danger";
}

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  neutral: "border border-slate-600/70 bg-slate-800/80 text-slate-200",
  success: "border border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  info: "border border-blue-500/40 bg-blue-500/15 text-blue-300",
  warning: "border border-warning/45 bg-warning/20 text-orange-200",
  danger: "border border-red-500/45 bg-red-500/20 text-rose-200",
};

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
