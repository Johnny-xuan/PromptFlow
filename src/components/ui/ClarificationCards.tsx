// 意图澄清卡片组件 - 显示问题和选项供用户选择

import { cn } from "../../lib/utils";
import type { ClarificationQuestion, UserSelection } from "../../types/intent";

interface ClarificationCardsProps {
  questions: ClarificationQuestion[];
  selections: UserSelection[];
  onSelect: (questionId: string, optionId: string) => void;
  onConfirm: () => void;
  onSkip: () => void;
}

export function ClarificationCards({
  questions,
  selections,
  onSelect,
  onConfirm,
  onSkip,
}: ClarificationCardsProps) {
  const currentQuestion = questions[0]; // 目前只显示一个问题
  const currentSelection = selections.find(s => s.questionId === currentQuestion?.id);

  if (!currentQuestion) return null;

  return (
    <div className="clarification-panel animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-slate-400">
          {currentQuestion.question}
        </p>
        <button
          onClick={onSkip}
          className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
        >
          跳过
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {currentQuestion.options.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(currentQuestion.id, option.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all",
              "border",
              currentSelection?.selectedOptionId === option.id
                ? "bg-indigo-500/20 border-indigo-500/40 text-slate-200"
                : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/[0.04] hover:text-slate-300"
            )}
          >
            <span className="text-base">{option.icon}</span>
            <span className="text-xs font-medium">{option.label}</span>
          </button>
        ))}
      </div>

      {currentSelection && (
        <div className="flex justify-end mt-3">
          <button
            onClick={onConfirm}
            className="px-4 py-1.5 text-xs font-medium bg-indigo-500/80 text-white rounded-lg hover:bg-indigo-500 transition-colors"
          >
            继续润色
          </button>
        </div>
      )}
    </div>
  );
}
