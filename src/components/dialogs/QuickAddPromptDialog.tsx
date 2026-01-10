import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Modal } from "../ui";
import { useI18n } from "../../lib/i18n/context";
import type { CreatePromptInput } from "../../types";

interface QuickAddPromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  folder: "favorites" | "templates";
  onSave: (input: CreatePromptInput) => Promise<void> | void;
}

export function QuickAddPromptDialog({ isOpen, onClose, folder, onSave }: QuickAddPromptDialogProps) {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ title?: string; content?: string; save?: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTitle("");
    setContent("");
    setDescription("");
    setTagInput("");
    setTags([]);
    setErrors({});
    setIsSaving(false);
  }, [isOpen, folder]);

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (!tag) return;
    if (tags.includes(tag)) {
      setTagInput("");
      return;
    }
    setTags([...tags, tag]);
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async () => {
    const nextErrors: { title?: string; content?: string; save?: string } = {};

    if (!title.trim()) nextErrors.title = "请输入标题";
    if (!content.trim()) nextErrors.content = "请输入内容";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSaving(true);
    setErrors({});

    try {
      await onSave({
        title: title.trim(),
        content: content.trim(),
        tags,
        description: description.trim() || undefined,
        folder,
      });
      onClose();
    } catch (err) {
      setErrors({ save: err instanceof Error ? err.message : String(err) });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={folder === "favorites" ? t.dialogs.quickAddFavorite : t.dialogs.quickAddTemplate}
      size="sm"
    >
      <div className="space-y-3">
        {/* 标题 */}
        <div className="space-y-1">
          <label className="block text-[11px] font-medium text-slate-400">{t.dialogs.title}</label>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors({});
            }}
            placeholder={folder === "favorites" ? "例如：中文润色" : "例如：通用润色模板"}
            className="w-full px-2.5 py-1.5 text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/10"
            autoFocus
          />
          {errors.title && <p className="text-[10px] text-red-400">{errors.title}</p>}
        </div>

        {/* 内容 */}
        <div className="space-y-1">
          <label className="block text-[11px] font-medium text-slate-400">{t.dialogs.content}</label>
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (errors.content) setErrors({});
            }}
            placeholder={folder === "templates" ? "可以使用 {{input}} 变量" : "粘贴或输入 Prompt"}
            rows={4}
            className="w-full px-2.5 py-2 text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/10 resize-none"
          />
          {errors.content && <p className="text-[10px] text-red-400">{errors.content}</p>}
        </div>

        {/* 描述 + 标签 - 同一行 */}
        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <label className="block text-[11px] font-medium text-slate-400">{t.dialogs.description}</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简单描述用途"
              className="w-full px-2.5 py-1.5 text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/10"
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="block text-[11px] font-medium text-slate-400">{t.dialogs.tags}</label>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.dialogs.tagsPlaceholder}
              className="w-full px-2.5 py-1.5 text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/10"
            />
          </div>
        </div>

        {/* 标签展示 */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-white/[0.04] text-slate-400 rounded"
              >
                #{tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-red-400 transition-colors"
                  type="button"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {errors.save && <p className="text-[10px] text-red-400">{errors.save}</p>}
      </div>

      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-white/[0.04]">
        <button
          onClick={onClose}
          disabled={isSaving}
          className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-lg transition-colors"
        >
          {t.common.cancel}
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="px-3 py-1.5 text-xs font-medium bg-indigo-500/80 text-white rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50"
        >
          {isSaving ? t.common.loading : t.common.save}
        </button>
      </div>
    </Modal>
  );
}
