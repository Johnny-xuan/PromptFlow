import { useState, useMemo } from "react";
import { Search, Star, Clock, Hash, Plus } from "lucide-react";
import { Modal } from "../ui";
import { useI18n } from "../../lib/i18n/context";
import type { PromptItem } from "../../types";

interface PromptListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  prompts: PromptItem[];
  onSelect: (prompt: PromptItem) => void;
  onAdd?: () => void;
}

export function PromptListDialog({ isOpen, onClose, prompts, onSelect, onAdd }: PromptListDialogProps) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");

  const filteredPrompts = useMemo(() => {
    let result = prompts;
    
    // 搜索过滤
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.tags.some((t) => t.toLowerCase().includes(query)) ||
          p.content.toLowerCase().includes(query)
      );
    }
    
    // 默认按使用次数排序
    return [...result].sort((a, b) => b.useCount - a.useCount);
  }, [prompts, search]);

  const handleSelect = (prompt: PromptItem) => {
    onSelect(prompt);
    onClose();
    setSearch("");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.dialogs.favoritePrompts} size="md">
      {/* Search + Add */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`${t.common.search}...`}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white/[0.03] border border-white/[0.06] rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/10"
            autoFocus
          />
        </div>

        {onAdd && (
          <button
            onClick={onAdd}
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors"
            title="新增"
            type="button"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* List */}
      <div className="space-y-1 max-h-[280px] overflow-y-auto">
        {filteredPrompts.length === 0 ? (
          <div className="py-8 text-center text-slate-600">
            {prompts.length === 0 ? (
              <div className="space-y-1">
                <Star className="w-6 h-6 mx-auto opacity-40" />
                <p className="text-xs">{t.dialogs.noFavorites}</p>
              </div>
            ) : (
              <p className="text-xs">{t.dialogs.noMatch}</p>
            )}
          </div>
        ) : (
          filteredPrompts.map((prompt) => (
            <button
              key={prompt.id}
              onClick={() => handleSelect(prompt)}
              className="w-full text-left p-2.5 rounded-lg hover:bg-white/[0.04] transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-[13px] font-medium text-slate-300 truncate group-hover:text-slate-100">
                    {prompt.title}
                  </h3>
                  <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                    {prompt.content}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-600 shrink-0">
                  <Clock className="w-3 h-3" />
                  <span>{prompt.useCount}</span>
                </div>
              </div>

              {/* Tags */}
              {prompt.tags.length > 0 && (
                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                  {prompt.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-white/[0.04] text-slate-500 rounded"
                    >
                      <Hash className="w-2 h-2" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))
        )}
      </div>

      {/* Count */}
      {prompts.length > 0 && (
        <div className="text-[10px] text-slate-600 mt-2 pt-2 border-t border-white/[0.04]">
          {filteredPrompts.length} / {prompts.length} {t.dialogs.items}
        </div>
      )}
    </Modal>
  );
}
