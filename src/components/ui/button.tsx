import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default:
    "bg-accent text-slate-950 hover:bg-emerald-300 disabled:bg-slate-700 disabled:text-slate-300",
  secondary:
    "bg-accentBlue text-white hover:bg-blue-400 disabled:bg-slate-700 disabled:text-slate-300",
  ghost:
    "bg-transparent text-slate-200 hover:bg-white/10 disabled:text-slate-500",
  outline:
    "border border-border bg-panelAlt text-slate-200 hover:border-accentBlue hover:text-white",
  danger:
    "bg-danger/90 text-white hover:bg-danger disabled:bg-slate-700 disabled:text-slate-300",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-3.5 text-sm",
  lg: "h-11 px-4 text-sm",
  icon: "h-9 w-9",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentBlue/60 focus-visible:ring-offset-0 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
);

Button.displayName = "Button";
