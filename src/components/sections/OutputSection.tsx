import { useState, useRef, useEffect } from "react";
import { Copy, Save, Check, MessageCircle, X, Send } from "lucide-react";
import { cn } from "../../lib/utils";
import { useI18n } from "../../lib/i18n/context";

interface OutputSectionProps {
  content: string;
  isVisible: boolean;
  onSave?: () => void;
  onChange?: (value: string) => void;
  onContinueChat?: (message: string) => void;
  isChatting?: boolean;
}

export function OutputSection({ content, isVisible, onSave, onChange, onContinueChat, isChatting }: OutputSectionProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [showChatInput, setShowChatInput] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const chatInputRef = useRef<HTMLInputElement>(null);

  // 弹出输入框时自动聚焦
  useEffect(() => {
    if (showChatInput && chatInputRef.current) {
      chatInputRef.current.focus();
    }
  }, [showChatInput]);

  const handleSendChat = () => {
    if (!chatMessage.trim() || isChatting) return;
    onContinueChat?.(chatMessage.trim());
    setChatMessage('');
    setShowChatInput(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    } else if (e.key === 'Escape') {
      setShowChatInput(false);
    }
  };

  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="relative panel-surface border-t border-white/5 px-6 py-3 flex-1 flex flex-col min-h-0">
      {/* Header with Result label and action buttons */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-1.5 h-1.5 rounded-full transition-all duration-500",
            content ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" : "bg-slate-700"
          )} />
          <span className="text-[11px] font-semibold text-slate-500 tracking-widest uppercase">{t.app.result}</span>
        </div>
        
        {/* Action buttons - always visible in header */}
        {content && (
          <div className="flex items-center gap-1">
            <button 
              onClick={onSave}
              className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-md transition-colors"
              title={t.common.save}
            >
              <Save className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={handleCopy}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                copied 
                  ? "text-emerald-400 bg-emerald-500/10" 
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              )}
              title={copied ? t.common.copied : t.common.copy}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            {/* 继续对话按钮 */}
            <button 
              onClick={() => setShowChatInput(!showChatInput)}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                showChatInput
                  ? "text-indigo-400 bg-indigo-500/10" 
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              )}
              title="继续对话"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Content area - editable textarea */}
      <div className="flex-1 min-h-0">
        {content ? (
          <textarea
            value={content}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full h-full bg-transparent resize-none outline-none app-editor text-slate-200 font-normal"
            spellCheck={false}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-slate-600 select-none">
            <p className="text-xs opacity-60">{t.app.outputPlaceholder}</p>
          </div>
        )}
      </div>

      {/* 继续对话输入框 */}
      {showChatInput && (
        <div className="absolute bottom-3 left-6 right-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2 p-2 bg-slate-800/90 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg">
            <input
              ref={chatInputRef}
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="继续补充或修改要求..."
              className="flex-1 bg-transparent text-xs text-slate-200 placeholder:text-slate-500 outline-none"
              disabled={isChatting}
            />
            <button
              onClick={handleSendChat}
              disabled={!chatMessage.trim() || isChatting}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                chatMessage.trim() && !isChatting
                  ? "text-indigo-400 hover:bg-indigo-500/10"
                  : "text-slate-600 cursor-not-allowed"
              )}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowChatInput(false)}
              className="p-1.5 text-slate-500 hover:text-slate-300 rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
