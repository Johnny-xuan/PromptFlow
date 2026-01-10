import { useState } from "react";
import { Save, Star, LayoutTemplate, X, Plus } from "lucide-react";
import { Modal, Button } from "../ui";
import { cn } from "../../lib/utils";

interface SaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  onSave: (data: SavePromptData) => void;
}

export interface SavePromptData {
  title: string;
  tags: string[];
  description?: string;
  folder: 'favorites' | 'templates';
  content: string;
}

export function SaveDialog({ isOpen, onClose, content, onSave }: SaveDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [folder, setFolder] = useState<'favorites' | 'templates'>('favorites');
  const [errors, setErrors] = useState<{ title?: string }>({});

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput("");
    }
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

  const handleSave = () => {
    const newErrors: { title?: string } = {};
    
    if (!title.trim()) {
      newErrors.title = "请输入标题";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      title: title.trim(),
      tags,
      description: description.trim() || undefined,
      folder,
      content,
    });

    handleClose();
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setTagInput("");
    setTags([]);
    setFolder('favorites');
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="保存 Prompt" size="md">
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        {/* Folder Selection */}
        <div className="space-y-2">
          <label className="form-label block text-sm font-medium">保存到</label>
          <div className="flex gap-2">
            <button
              onClick={() => setFolder('favorites')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg border transition-all",
                folder === 'favorites'
                  ? "bg-indigo-500/15 border-indigo-500/50 text-indigo-500"
                  : "form-input hover:border-[var(--accent)]/30"
              )}
            >
              <Star className="w-4 h-4" />
              <span className="text-sm font-medium">常用</span>
            </button>
            <button
              onClick={() => setFolder('templates')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg border transition-all",
                folder === 'templates'
                  ? "bg-violet-500/15 border-violet-500/50 text-violet-500"
                  : "form-input hover:border-[var(--accent)]/30"
              )}
            >
              <LayoutTemplate className="w-4 h-4" />
              <span className="text-sm font-medium">模板</span>
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="form-label block text-sm font-medium">标题</label>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors({});
            }}
            placeholder="给这个 Prompt 起个名字"
            className={cn(
              "form-input w-full px-3 py-2 rounded-lg text-sm",
              "focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]/50",
              errors.title && "border-red-500/50 focus:ring-red-500/30"
            )}
            autoFocus
          />
          {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="form-label block text-sm font-medium">描述 (可选)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="简单描述这个 Prompt 的用途"
            rows={2}
            className="form-input w-full px-3 py-2 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]/50"
          />
        </div>

        {/* Tags */}
        <div className="space-y-1.5">
          <label className="form-label block text-sm font-medium">标签</label>
          <div className="flex gap-2">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入标签后按回车"
              className="form-input flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]/50"
            />
            <Button variant="secondary" size="md" onClick={handleAddTag}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-[var(--accent)]/10 text-[var(--accent)] rounded-md"
                >
                  #{tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content Preview */}
        <div className="space-y-1.5">
          <label className="form-label block text-sm font-medium">内容预览</label>
          <div className="p-3 rounded-lg border border-[var(--input-border)] bg-[var(--output-bg)] max-h-[100px] overflow-y-auto">
            <p className="form-text-muted text-sm whitespace-pre-wrap line-clamp-4">
              {content || "无内容"}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-[var(--divider)]">
        <Button variant="ghost" onClick={handleClose}>
          取消
        </Button>
        <Button onClick={handleSave}>
          <Save className="w-4 h-4" />
          保存
        </Button>
      </div>
    </Modal>
  );
}
