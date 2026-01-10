import { forwardRef, TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label 
            htmlFor={id} 
            className="block text-sm font-medium text-slate-300"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            "w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl",
            "text-slate-200 placeholder:text-slate-500",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 focus:bg-white/[0.07]",
            "transition-all duration-200 resize-none",
            error && "border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

TextArea.displayName = "TextArea";
