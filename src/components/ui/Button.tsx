import { forwardRef, ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, disabled, children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
      primary: "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98]",
      secondary: "bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-secondary)] hover:bg-[var(--panel-bg-focus)] hover:border-[var(--accent)]/30",
      ghost: "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--input-bg)]",
      danger: "bg-red-500/80 text-white hover:bg-red-500",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-5 py-2.5 text-sm",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
