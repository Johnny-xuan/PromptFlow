import { useState, useRef, useEffect } from "react";
import { Star, LayoutTemplate, PenLine, Loader2, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { useI18n } from "../../lib/i18n/context";
import type { PolishPreset } from "../../types";
import type { ClarificationQuestion, UserSelection } from "../../types/intent";

// 多问题澄清模态框 - 一次性显示所有问题
function ClarificationModal({
  questions,
  selections,
  onSelect,
  onConfirm,
  onSkip,
}: {
  questions: ClarificationQuestion[];
  selections: UserSelection[];
  onSelect?: (questionId: string, optionId: string, customInput?: string, selectedIds?: string[]) => void;
  onConfirm?: () => void;
  onSkip?: () => void;
}) {
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});

  const handleOptionClick = (question: ClarificationQuestion, optionId: string) => {
    const isMultiple = question.type === 'multiple';
    const currentSelection = selections.find(s => s.questionId === question.id);
    
    if (isMultiple) {
      const currentIds = currentSelection?.selectedOptionIds || [];
      const newIds = currentIds.includes(optionId)
        ? currentIds.filter(id => id !== optionId)
        : [...currentIds, optionId];
      onSelect?.(question.id, newIds[0] || '', customInputs[question.id], newIds);
    } else {
      onSelect?.(question.id, optionId, customInputs[question.id]);
    }
  };

  const handleCustomInputChange = (questionId: string, value: string) => {
    setCustomInputs(prev => ({ ...prev, [questionId]: value }));
    const selection = selections.find(s => s.questionId === questionId);
    if (selection) {
      onSelect?.(questionId, selection.selectedOptionId, value, selection.selectedOptionIds);
    }
  };

  const isOptionSelected = (question: ClarificationQuestion, optionId: string) => {
    const selection = selections.find(s => s.questionId === question.id);
    if (question.type === 'multiple') {
      return selection?.selectedOptionIds?.includes(optionId) || false;
    }
    return selection?.selectedOptionId === optionId;
  };

  const getSelection = (questionId: string) => selections.find(s => s.questionId === questionId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in-95 duration-200 w-[480px] max-w-[90vw] max-h-[80vh] overflow-y-auto bg-[#0F0F14] border border-white/10 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[#0F0F14] px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-white">补充一些信息</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">帮助我更好地理解你的需求</p>
          </div>
          <button
            onClick={onSkip}
            className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
          >
            跳过
          </button>
        </div>

        {/* Questions */}
        <div className="p-5 space-y-5">
          {questions.map((question, idx) => {
            const isMultiple = question.type === 'multiple';
            const selection = getSelection(question.id);
            const showCustomInput = isMultiple
              ? selection?.selectedOptionIds?.includes('other')
              : question.options.find(o => o.id === selection?.selectedOptionId)?.allowCustomInput;

            return (
              <div key={question.id} className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-medium flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <p className="text-[13px] font-medium text-slate-200">{question.question}</p>
                  {isMultiple && (
                    <span className="text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">多选</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pl-7">
                  {question.options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleOptionClick(question, option.id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all border text-[12px]",
                        isOptionSelected(question, option.id)
                          ? "bg-indigo-500/20 border-indigo-500/40 text-slate-200"
                          : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/[0.04] hover:text-slate-300"
                      )}
                    >
                      <span>{option.icon}</span>
                      <span className="font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>

                {showCustomInput && (
                  <div className="pl-7">
                    <input
                      type="text"
                      value={customInputs[question.id] || ''}
                      onChange={(e) => handleCustomInputChange(question.id, e.target.value)}
                      placeholder="请输入具体说明..."
                      className="w-full px-3 py-2 text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#0F0F14] px-5 py-4 border-t border-white/[0.06] flex justify-end">
          <button
            onClick={onConfirm}
            className="px-5 py-2 text-[13px] font-medium bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            开始润色
          </button>
        </div>
      </div>
    </div>
  );
}

interface InputSectionProps {
  value: string;
  onChange: (value: string) => void;
  onPolish: () => void;
  onFavorites: () => void;
  onTemplates: () => void;
  isPolishing?: boolean;
  isAnalyzing?: boolean;
  presets: PolishPreset[];
  currentPreset: string;
  onPresetChange: (presetId: string) => void;
  // Checker 一次性多问题澄清
  clarificationQuestions?: ClarificationQuestion[];
  userSelections?: UserSelection[];
  onClarificationSelect?: (questionId: string, optionId: string, customInput?: string, selectedIds?: string[]) => void;
  onClarificationConfirm?: () => void;
  onClarificationSkip?: () => void;
}

export function InputSection({ 
  value, 
  onChange, 
  onPolish,
  onFavorites, 
  onTemplates, 
  isPolishing,
  isAnalyzing,
  presets,
  currentPreset,
  onPresetChange,
  clarificationQuestions = [],
  userSelections = [],
  onClarificationSelect,
  onClarificationConfirm,
  onClarificationSkip,
}: InputSectionProps) {
  const { t } = useI18n();
  const [showPresets, setShowPresets] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activePreset = presets.find(p => p.id === currentPreset) || presets[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowPresets(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative flex flex-col flex-1 px-6 pt-4 pb-5 panel-surface">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t.app.inputPlaceholder}
        className="w-full h-full flex-1 bg-transparent resize-none outline-none app-editor text-slate-100 placeholder:text-slate-600 font-normal tracking-wide"
        spellCheck={false}
        autoFocus
      />

      {/* 澄清卡片 - 一次性显示所有问题 */}
      {clarificationQuestions.length > 0 && (
        <ClarificationModal
          questions={clarificationQuestions}
          selections={userSelections}
          onSelect={onClarificationSelect}
          onConfirm={onClarificationConfirm}
          onSkip={onClarificationSkip}
        />
      )}

      {/* 分析中提示 */}
      {isAnalyzing && (
        <div className="flex items-center gap-2 py-3 text-xs text-slate-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>正在分析意图...</span>
        </div>
      )}
      
      <div className="flex items-end justify-between mt-auto pt-4">
        {/* Left Actions: Sources + IME Toggle */}
        <div className="flex items-center gap-1">
          <button 
            onClick={onFavorites}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-lg transition-colors"
          >
            <Star className="w-3.5 h-3.5" />
            <span>{t.app.favorites}</span>
          </button>
          <button 
            onClick={onTemplates}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-lg transition-colors"
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span>{t.app.templates}</span>
          </button>
        </div>

        {/* Right Action: Preset Selector + Polish */}
        <div className="flex items-center gap-2">
          {/* Preset Selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-lg transition-colors"
            >
              <span>{activePreset?.icon}</span>
              <span>{activePreset?.name}</span>
              <ChevronDown className={cn("w-3 h-3 transition-transform", showPresets && "rotate-180")} />
            </button>

            {/* Dropdown */}
            {showPresets && (
              <div className="absolute bottom-full right-0 mb-2 w-36 py-1 dropdown-menu backdrop-blur-2xl border border-white/[0.06] rounded-lg shadow-xl z-50">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      onPresetChange(preset.id);
                      setShowPresets(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-[11px] transition-colors dropdown-item",
                      preset.id === currentPreset
                        ? "dropdown-item-active"
                        : ""
                    )}
                  >
                    <span className="text-xs">{preset.icon}</span>
                    <span className="font-medium">{preset.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Polish Button */}
          <button
            onClick={onPolish}
            disabled={isPolishing || !value.trim()}
            className={cn(
              "flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all min-w-[100px]",
              "bg-white/5 border border-white/5",
              value.trim() 
                ? "text-slate-300 hover:text-slate-100 hover:bg-white/[0.08] cursor-pointer polish-glow" 
                : "text-slate-600 cursor-not-allowed",
              isPolishing && "opacity-90 cursor-wait"
            )}
          >
            {isPolishing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <PenLine className="w-4 h-4" />
            )}
            <span>{t.app.polish}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
