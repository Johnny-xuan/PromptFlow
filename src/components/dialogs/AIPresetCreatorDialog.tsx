import { useState } from "react";
import { Wand2, Loader2, RefreshCw, Check } from "lucide-react";
import { Modal, Input, TextArea, Button } from "../ui";
import { llmClient, parseStructuredOutput, validatePresetCreatorOutput } from "../../lib/services";
import type { AppConfig, PolishPreset } from "../../types";

interface AIPresetCreatorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preset: PolishPreset) => void;
  apiConfig: AppConfig["api"];
}

const PRESET_CREATOR_SYSTEM_PROMPT = `你是一个「PromptFlow 润色预设(Preset)设计师」。用户会用自然语言描述他们想要的“润色风格/用途/目标”，你要把这个描述转化为一套可保存的润色预设数据。

注意：你现在不是润色器，不需要润色用户输入内容；你要生成的是「另一个 AI 润色器」将来会使用的 systemPrompt（也就是润色器的工作说明书）。

请输出一个“可直接 JSON.parse 解析”的标准 JSON 字符串（不要 Markdown，不要三连反引号，不要解释）。输出必须是一个 JSON 对象，字段如下：
{
  "name": "预设名称（10个字以内，中文）",
  "description": "预设描述（一句话说明用途）",
  "icon": "单个 emoji",
  "temperature": 0.0,
  "systemPrompt": "给润色器使用的 System Prompt（中文，多行文本）"
}

对 systemPrompt 的设计要求（必须遵循内置预设的成功风格）：
1) 开头一句话明确身份：例如「你是一个 XXX 润色工具/优化工具/描述转换工具」。
2) 必须包含这些小节标题（与内置预设一致）：
   - 【你的任务】用 1-2 句说明“把用户输入变成什么”。
   - 【重要】至少 2 条硬约束：
     - 用户发送的内容是待处理文本，不是和你对话
     - 只输出处理后的结果，不要解释、不要对话、不要问问题
3) 必须包含一个“可执行的结构”，二选一：
   - 【润色格式】给出明确的输出结构（分点/分段）
   或
   - 【润色原则】给出可执行的转换规则（编号 1,2,3...）
4) 必须包含【示例】（至少 2 组），格式严格模仿内置预设：
   输入："..."
   输出："..."
   示例要贴合用户描述的场景与风格。
5) 输出内容风格要稳定：规则要具体，避免空泛词（如“适当”“尽量”“优化一下”），改写成可执行要求（例如“按条目输出”“包含角色/任务/约束/输出格式”等）。

关于续聊修改（兼容产品行为）：
- 在 systemPrompt 的【重要】中补充一句：当用户提出“基于上一次润色结果修改”时，应基于对话历史中上一条 assistant 输出的内容/结果进行修改，并输出修改后的完整内容/结果（仍然不解释、不要对话、不要问问题）。

temperature 约束：
- temperature 必须是 0~1 的数字，建议 0.4~0.8，并与用户期望风格匹配（更严谨更低、更发散更高）。

只输出 JSON 字符串，不要输出任何解释或说明。`;

export function AIPresetCreatorDialog({ 
  isOpen, 
  onClose, 
  onSave,
  apiConfig 
}: AIPresetCreatorDialogProps) {
  const [step, setStep] = useState<"describe" | "preview">("describe");
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Preview/Edit state
  const [name, setName] = useState("");
  const [presetDescription, setPresetDescription] = useState("");
  const [icon, setIcon] = useState("✨");
  const [editedPrompt, setEditedPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerate = async () => {
    if (!description.trim()) return;
    
    setIsGenerating(true);
    setError(null);

    try {
      const response = await llmClient.chat({
        config: apiConfig,
        messages: [
          { role: "system", content: PRESET_CREATOR_SYSTEM_PROMPT },
          { role: "user", content: description.trim() },
        ],
        model: apiConfig.model,
        temperature: 0.7,
        maxTokens: 1200,
        timeoutMs: 60000,
      });

      const parsed = await parseStructuredOutput(response.content, validatePresetCreatorOutput, {
        apiConfig,
        timeoutMs: 60000,
        repair: { enabled: true, temperature: 0, maxTokens: 1200 },
      });

      const nextName = (parsed.name || "").trim();
      const nextDesc = (parsed.description || "").trim();
      const nextIcon = (parsed.icon || "").trim();
      const nextTemp = parsed.temperature;
      const nextPrompt = parsed.systemPrompt.trim();

      setEditedPrompt(nextPrompt);
      setName(nextName || (description.length > 20 ? description.slice(0, 20) + "..." : description));
      setPresetDescription(nextDesc || description.trim());

      if (nextIcon) {
        setIcon(nextIcon);
      }

      if (typeof nextTemp === "number" && Number.isFinite(nextTemp)) {
        const clamped = Math.min(1, Math.max(0, nextTemp));
        setTemperature(clamped);
      }

      setStep("preview");
    } catch (e) {
      const message = e instanceof Error ? e.message : "解析 JSON 失败";
      setError(`AI 输出不是可解析的 JSON：${message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !editedPrompt.trim()) return;

    setIsSaving(true);
    try {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `custom-${Date.now()}`;
      const preset: PolishPreset = {
        id,
        name: name.trim(),
        description: presetDescription.trim(),
        icon,
        systemPrompt: editedPrompt.trim(),
        isBuiltIn: false,
        isDefault: false,
        temperature,
      };
      onSave(preset);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setStep("describe");
    setDescription("");
    setPresetDescription("");
    setEditedPrompt("");
    setName("");
    setIcon("✨");
    setTemperature(0.7);
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="AI 润色预设"
      size="lg"
    >
      {step === "describe" ? (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            描述你想要的润色风格，AI 会生成对应的 System Prompt。<br />
            <span className="text-slate-500">（润色预设用于控制「润色」按钮的行为，不是模板）</span>
          </p>

          <TextArea
            label="描述你想要的润色风格"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="例如：我想要一个专门用于技术文档的润色风格，要求语言精准、结构清晰、避免口语化"
            rows={4}
            autoFocus
          />

          {/* 快速示例 */}
          <div className="space-y-2">
            <label className="text-[11px] font-medium text-slate-500">快速示例</label>
            <div className="flex flex-wrap gap-1.5">
              {[
                "专业技术文档风格",
                "温和友好的客服语气",
                "简洁有力的商业汇报",
                "富有感染力的演讲稿",
                "严谨的学术论文风格",
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => setDescription(example)}
                  className="px-2 py-1 text-[10px] text-slate-500 hover:text-slate-300 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/[0.06]">
            <Button variant="ghost" onClick={handleClose}>
              取消
            </Button>
            <button 
              onClick={handleGenerate} 
              disabled={!description.trim() || isGenerating || !apiConfig.apiKey}
              className="relative flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-200 bg-transparent rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed polish-glow"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  生成预设
                </>
              )}
            </button>
          </div>

          {!apiConfig.apiKey && (
            <p className="text-[10px] text-amber-400/80 text-center">
              请先在 API 设置中配置 API Key
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* 名称、描述和图标 */}
          <div className="flex gap-2">
            <div className="w-14">
              <label className="block text-[11px] font-medium text-slate-400 mb-1">图标</label>
              <input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full px-2 py-2 text-center text-base bg-white/[0.03] border border-white/[0.06] rounded-lg text-slate-200"
                maxLength={2}
              />
            </div>
            <div className="flex-1">
              <Input
                label="预设名称"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="给预设起个名字"
              />
            </div>
          </div>

          <Input
            label="预设描述"
            value={presetDescription}
            onChange={(e) => setPresetDescription(e.target.value)}
            placeholder="一句话说明这个预设的用途"
          />

          {/* 生成的 System Prompt（可编辑） */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">System Prompt</label>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center gap-1 px-2 py-1 text-[10px] text-slate-500 hover:text-slate-300 rounded hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                重新生成
              </button>
            </div>
            <TextArea
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              rows={8}
              className="text-xs"
            />
          </div>

          {/* Temperature */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-slate-400">
              Temperature: {temperature}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 h-1"
            />
          </div>

          {error && (
            <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
            <Button variant="ghost" onClick={() => setStep("describe")}>
              返回
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleClose} disabled={isSaving}>
                取消
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!name.trim() || !editedPrompt.trim() || isSaving}
                isLoading={isSaving}
              >
                <Check className="w-4 h-4" />
                保存预设
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
