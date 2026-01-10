import { useState, useMemo, useEffect } from "react";
import { Search, LayoutTemplate, Hash, Eye, ArrowRight, Plus, Pencil, X, Save, Trash2 } from "lucide-react";
import { Modal } from "../ui";
import { cn } from "../../lib/utils";
import type { PromptItem } from "../../types";
import { promptService } from "../../lib/services";

interface TemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  templates: PromptItem[];
  currentInput: string;
  onApply: (result: string) => void;
  onAdd?: () => void;
  onTemplatesRefresh?: () => Promise<void> | void;
}

export function TemplateDialog({ 
  isOpen, 
  onClose, 
  templates, 
  currentInput, 
  onApply,
  onAdd,
  onTemplatesRefresh,
}: TemplateDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<PromptItem | null>(null);
  const [view, setView] = useState<"list" | "preview" | "edit">("list");

  // edit state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editContent, setEditContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setView("list");
    setSelectedTemplate(null);
    setSearch("");
    setTagInput("");
    setEditTags([]);
    setSaveError(null);
    setIsSaving(false);
    setDeleteConfirmOpen(false);
  }, [isOpen]);

  const filteredTemplates = useMemo(() => {
    if (!search.trim()) return templates;
    const query = search.toLowerCase();
    return templates.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        t.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [templates, search]);

  const hasVariable = (content: string) => content.includes("{{input}}");

  const applyTemplate = (template: PromptItem) => {
    let result = template.content;
    if (hasVariable(result) && currentInput.trim()) {
      result = result.replace(/\{\{input\}\}/g, currentInput);
    }
    return result;
  };

  const handleApply = () => {
    if (!selectedTemplate) return;
    onApply(applyTemplate(selectedTemplate));
    handleClose();
  };

  const handleClose = () => {
    setSelectedTemplate(null);
    setView("list");
    setSearch("");
    setTagInput("");
    setEditTags([]);
    setSaveError(null);
    setIsSaving(false);
    setDeleteConfirmOpen(false);
    onClose();
  };

  const previewContent = selectedTemplate ? applyTemplate(selectedTemplate) : "";

  const startEdit = () => {
    if (!selectedTemplate) return;
    setEditTitle(selectedTemplate.title || "");
    setEditDescription(selectedTemplate.description || "");
    setEditContent(selectedTemplate.content || "");
    setEditTags(selectedTemplate.tags || []);
    setTagInput("");
    setSaveError(null);
    setView("edit");
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (!tag) return;
    if (editTags.includes(tag)) {
      setTagInput("");
      return;
    }
    setEditTags([...editTags, tag]);
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditTags(editTags.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const requestDeleteTemplate = () => {
    if (!selectedTemplate) return;
    if (isSaving) return;
    setSaveError(null);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteTemplate = async () => {
    if (!selectedTemplate) return;
    if (isSaving) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      await promptService.deletePrompt(selectedTemplate.id, "templates");
      await onTemplatesRefresh?.();
      setDeleteConfirmOpen(false);
      setSelectedTemplate(null);
      setView("list");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEdits = async () => {
    if (!selectedTemplate) return;
    if (!editTitle.trim() || !editContent.trim()) {
      setSaveError("标题和内容不能为空");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await promptService.updatePrompt(selectedTemplate.id, "templates", {
        title: editTitle.trim(),
        content: editContent.trim(),
        tags: editTags,
        description: editDescription.trim() || undefined,
      });

      await onTemplatesRefresh?.();
      setView("preview");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="选择模板" size="md">
      {deleteConfirmOpen && selectedTemplate && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60">
          <div className="w-[360px] max-w-[90vw] rounded-xl border border-white/10 bg-[#1A1A24] p-4 shadow-2xl">
            <div className="text-[13px] font-medium text-slate-200">删除模板</div>
            <div className="mt-1 text-[11px] text-slate-400">
              确定删除模板「{selectedTemplate.title}」吗？此操作不可撤销。
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={isSaving}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                type="button"
              >
                取消
              </button>
              <button
                onClick={confirmDeleteTemplate}
                disabled={isSaving}
                className="px-3 py-1.5 text-xs font-medium bg-red-500/80 text-white rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50"
                type="button"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
      {view === "list" ? (
        <>
          {/* Search */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-white/[0.03] border border-white/[0.06] rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/10"
                autoFocus
              />
            </div>

            {onAdd && (
              <button
                onClick={onAdd}
                className="w-9 h-9 inline-flex items-center justify-center rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors"
                title="手动新增"
                type="button"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Template List */}
          <div className="space-y-1 max-h-[280px] overflow-y-auto">
            {filteredTemplates.length === 0 ? (
              <div className="py-8 text-center text-slate-600">
                {templates.length === 0 ? (
                  <div className="space-y-1">
                    <LayoutTemplate className="w-6 h-6 mx-auto opacity-40" />
                    <p className="text-xs">还没有模板</p>
                  </div>
                ) : (
                  <p className="text-xs">没有找到匹配的模板</p>
                )}
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={cn(
                    "w-full text-left p-2.5 rounded-lg transition-colors relative overflow-hidden",
                    selectedTemplate?.id === template.id
                      ? "bg-indigo-500/10 border border-indigo-500/25"
                      : "hover:bg-white/[0.04]"
                  )}
                >
                  {selectedTemplate?.id === template.id && (
                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[13px] font-medium text-slate-300">{template.title}</h3>
                    {hasVariable(template.content) && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-violet-500/15 text-violet-400 rounded shrink-0">
                        {"{{input}}"}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                    {template.description || template.content}
                  </p>

                  {template.tags.length > 0 && (
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {template.tags.slice(0, 3).map((tag) => (
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

          {/* Actions */}
          {selectedTemplate && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
              <button
                onClick={requestDeleteTemplate}
                disabled={isSaving}
                className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/5 transition-colors disabled:opacity-50"
                title="删除模板"
                type="button"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setView("preview")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-lg transition-colors"
                  type="button"
                >
                  <Eye className="w-3.5 h-3.5" />
                  预览
                </button>
                <button
                  onClick={startEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-lg transition-colors"
                  type="button"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  编辑
                </button>
                <button 
                  onClick={handleApply}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-500/80 text-white rounded-lg hover:bg-indigo-500 transition-colors"
                  type="button"
                >
                  应用
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : view === "preview" ? (
        <>
          {/* Preview Mode */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-medium text-slate-300">{selectedTemplate?.title}</h3>
              <button
                onClick={() => setView("list")}
                className="text-[11px] text-slate-500 hover:text-slate-300"
              >
                返回
              </button>
            </div>
            
            <div className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.04] max-h-[240px] overflow-y-auto">
              <pre className="text-[12px] text-slate-400 whitespace-pre-wrap font-sans leading-relaxed">
                {previewContent}
              </pre>
            </div>

            {hasVariable(selectedTemplate?.content || "") && !currentInput.trim() && (
              <p className="text-[10px] text-amber-500/70">
                提示：输入区为空，{"{{input}}"} 变量将保持原样
              </p>
            )}
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
            <button
              onClick={requestDeleteTemplate}
              disabled={isSaving}
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/5 transition-colors disabled:opacity-50"
              title="删除模板"
              type="button"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-end gap-2">
              <button 
                onClick={() => setView("list")}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-lg transition-colors"
                type="button"
              >
                返回
              </button>
              <button 
                onClick={startEdit}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-lg transition-colors"
                type="button"
              >
                编辑
              </button>
              <button 
                onClick={handleApply}
                className="px-3 py-1.5 text-xs font-medium bg-indigo-500/80 text-white rounded-lg hover:bg-indigo-500 transition-colors"
                type="button"
              >
                应用模板
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Edit Mode */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-medium text-slate-300">编辑模板</h3>
              <button
                onClick={() => setView("preview")}
                disabled={isSaving}
                className="text-[11px] text-slate-500 hover:text-slate-300 disabled:opacity-50"
              >
                返回
              </button>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-slate-400">标题</label>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/10"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-slate-400">描述</label>
              <input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="简单描述用途"
                className="w-full px-2.5 py-1.5 text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/10"
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <label className="block text-[11px] font-medium text-slate-400">标签</label>
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="输入后回车添加"
                  className="w-full px-2.5 py-1.5 text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/10"
                />
              </div>
              <button
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
                className="self-end px-3 py-1.5 text-xs text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                type="button"
              >
                添加
              </button>
            </div>

            {editTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {editTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-white/[0.04] text-slate-400 rounded"
                  >
                    <Hash className="w-2 h-2" />
                    {tag}
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

            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-slate-400">内容</label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={8}
                className="w-full px-2.5 py-2 text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/10 resize-none"
              />
            </div>

            {saveError && (
              <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-xs text-red-400">{saveError}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-white/[0.04]">
            <button
              onClick={() => setView("preview")}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
              type="button"
            >
              取消
            </button>
            <button
              onClick={handleSaveEdits}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-500/80 text-white rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50"
              type="button"
            >
              {isSaving ? (
                <>
                  <Save className="w-3.5 h-3.5" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  保存
                </>
              )}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
