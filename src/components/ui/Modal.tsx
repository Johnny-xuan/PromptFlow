import { ReactNode, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  showCloseButton?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className,
  contentClassName,
  showCloseButton = true,
  size = "md"
}: ModalProps) {
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  return (
    <div className="fixed inset-x-0 top-12 bottom-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop - 不覆盖标题栏 */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div 
        className={cn(
          "relative w-full",
          "modal-content backdrop-blur-2xl",
          "rounded-xl",
          "shadow-2xl",
          "animate-in zoom-in-95 fade-in duration-200",
          sizes[size],
          className
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="modal-header flex items-center justify-between px-4 py-3">
            {title && (
              <h2 className="modal-title text-sm font-semibold">{title}</h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="modal-close-btn p-1.5 rounded-lg transition-colors ml-auto"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        
        {/* Body */}
        <div className={cn("p-4", contentClassName)}>
          {children}
        </div>
      </div>
    </div>
  );
}
