import { ArrowLeft, Settings, X, FileText } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { windowService } from "../../lib/services";

interface TitleBarProps {
  mode?: "main" | "settings";
  onSettingsClick?: () => void;
  onBackClick?: () => void;
  checkerEnabled?: boolean;
  onCheckerToggle?: (enabled: boolean) => void;
}

export function TitleBar({ mode = "main", onSettingsClick, onBackClick, checkerEnabled, onCheckerToggle }: TitleBarProps) {
  const handleDragStart = async (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    try {
      await getCurrentWindow().startDragging();
    } catch (err) {
      console.error("[TitleBar] startDragging failed:", err);
    }
  };

  const handleClose = () => {
    windowService.hide().catch((err) => console.error("[PromptFlow] hide failed:", err));
  };

  return (
    <div 
      onMouseDown={handleDragStart}
      className="h-12 flex items-center justify-between px-5 select-none cursor-move relative z-[60] bg-gradient-to-b from-white/[0.06] to-transparent border-b border-white/[0.04]"
    >
      <div className="flex items-center gap-2">
        <img 
          src="/pf_icon.png" 
          alt="PF" 
          className="w-6 h-6 rounded-md shadow-sm"
        />
        <span className="text-[13px] font-semibold text-slate-300 tracking-wide">PromptFlow</span>
      </div>
      
      <div className="flex items-center gap-1 text-slate-500">
        {mode === "settings" ? (
          <button 
            className="hover:text-slate-300 transition-colors p-2 rounded-lg hover:bg-white/5 cursor-default"
            title="Back"
            onClick={() => onBackClick?.()}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        ) : (
          <>
            {onCheckerToggle && (
              <div className="relative group">
                <button 
                  className={`transition-colors p-2 rounded-lg cursor-default ${
                    checkerEnabled
                      ? "text-indigo-400 bg-indigo-500/10"
                      : "hover:text-slate-300 hover:bg-white/5"
                  }`}
                  onClick={() => onCheckerToggle(!checkerEnabled)}
                >
                  <FileText className="w-4 h-4" />
                </button>
                {/* Tooltip */}
                <div className="absolute right-0 top-full mt-2 px-3 py-2 bg-[#1A1A24] border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] whitespace-nowrap">
                  <div className="text-[12px] font-medium text-white mb-0.5">
                    意图澄清 {checkerEnabled ? "(已开启)" : "(已关闭)"}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {checkerEnabled 
                      ? "润色前会先分析并补全模糊的输入" 
                      : "点击开启，润色前会先补全模糊输入"
                    }
                  </div>
                </div>
              </div>
            )}
            <button 
              className="hover:text-slate-300 transition-colors p-2 rounded-lg hover:bg-white/5 cursor-default"
              title="Settings"
              onClick={() => onSettingsClick?.()}
            >
              <Settings className="w-4 h-4" />
            </button>
          </>
        )}
        <button 
          className="hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-white/5 cursor-default"
          title="Close"
          onClick={handleClose}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
