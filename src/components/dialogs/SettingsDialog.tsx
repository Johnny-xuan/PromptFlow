import { useState, useEffect } from "react";
import { Palette, Key, Sparkles, FolderOpen, RotateCcw, Plus, Pencil, Trash2, Check, Wand2 } from "lucide-react";
import { Modal } from "../ui";
import { cn } from "../../lib/utils";
import type { AppConfig, PolishPreset } from "../../types";
import { BUILT_IN_PRESETS, PROVIDER_MODELS } from "../../types";
import { openPath, revealItemInDir } from "@tauri-apps/plugin-opener";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { promptService } from "../../lib/services";
import { AIPresetCreatorDialog } from "./AIPresetCreatorDialog";
import { useI18n } from "../../lib/i18n/context";

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onSave: (config: AppConfig) => void;
  onDataChanged?: () => void;
}

type TabId = 'ui' | 'api' | 'polish' | 'storage';

const tabIcons: Record<TabId, React.ReactNode> = {
  ui: <Palette className="w-4 h-4" />,
  api: <Key className="w-4 h-4" />,
  polish: <Sparkles className="w-4 h-4" />,
  storage: <FolderOpen className="w-4 h-4" />,
};

export function SettingsDialog({ isOpen, onClose, config, onSave }: SettingsDialogProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabId>('ui');
  
  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'ui', label: t.settings.ui, icon: tabIcons.ui },
    { id: 'api', label: 'API', icon: tabIcons.api },
    { id: 'polish', label: t.settings.polish, icon: tabIcons.polish },
    { id: 'storage', label: t.settings.storage, icon: tabIcons.storage },
  ];
  const [localConfig, setLocalConfig] = useState<AppConfig>(config);
  const [showAIPresetCreator, setShowAIPresetCreator] = useState(false);

  // 当对话框打开或 config 更新时，同步 localConfig
  useEffect(() => {
    if (isOpen) {
      setLocalConfig(config);
    }
  }, [isOpen, config]);

  const updateUI = (updates: Partial<AppConfig['ui']>) => {
    setLocalConfig({ ...localConfig, ui: { ...localConfig.ui, ...updates } });
  };

  const updateAPI = (updates: Partial<AppConfig['api']>) => {
    setLocalConfig({ ...localConfig, api: { ...localConfig.api, ...updates } });
  };

  const updateStorage = (updates: Partial<AppConfig['storage']>) => {
    setLocalConfig({ ...localConfig, storage: { ...localConfig.storage, ...updates } });
  };

  const updatePolish = (updates: Partial<AppConfig['polish']>) => {
    setLocalConfig({ ...localConfig, polish: { ...localConfig.polish, ...updates } });
  };

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  const handleReset = () => {
    setLocalConfig(config);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.settings.title} size="lg">
      <div className="flex gap-3 h-[360px]">
        {/* Sidebar - 更简洁 */}
        <div className="w-24 shrink-0 space-y-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-white/[0.06] text-slate-200"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content - 固定高度，内容滚动 */}
        <div className="flex-1 border-l border-white/[0.04] pl-3 overflow-y-auto">
          {activeTab === 'ui' && (
            <UISettings config={localConfig.ui} onChange={updateUI} />
          )}
          {activeTab === 'api' && (
            <APISettings config={localConfig.api} onChange={updateAPI} />
          )}
          {activeTab === 'polish' && (
            <PolishSettings 
              config={localConfig} 
              onChange={updatePolish} 
              onOpenAICreator={() => setShowAIPresetCreator(true)}
            />
          )}
          {activeTab === 'storage' && (
            <StorageSettings config={localConfig.storage} onChange={updateStorage} />
          )}
        </div>
      </div>

      {/* Actions - 更简洁 */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.04]">
        <button 
          onClick={handleReset}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] text-slate-500 hover:text-slate-300 rounded-lg hover:bg-white/5 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          {t.common.reset}
        </button>
        <div className="flex gap-2">
          <button 
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-300 rounded-lg hover:bg-white/5 transition-colors"
          >
            {t.common.cancel}
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-500/80 text-white rounded-lg hover:bg-indigo-500 transition-colors"
          >
            {t.common.save}
          </button>
        </div>
      </div>

      {/* AI Preset Creator Dialog */}
      <AIPresetCreatorDialog
        isOpen={showAIPresetCreator}
        onClose={() => setShowAIPresetCreator(false)}
        apiConfig={localConfig.api}
        onSave={(preset) => {
          const newPresets = [...localConfig.polish.presets, preset];
          setLocalConfig({
            ...localConfig,
            polish: { ...localConfig.polish, presets: newPresets },
          });
        }}
      />
    </Modal>
  );
}

// UI Settings Tab
function UISettings({ 
  config, 
  onChange 
}: { 
  config: AppConfig['ui']; 
  onChange: (updates: Partial<AppConfig['ui']>) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      {/* Hotkey - 暂时锁定，不可修改 */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-medium text-slate-400">{t.settings.hotkey}</label>
        <input
          value={config.hotkey}
          readOnly
          className="w-full px-2.5 py-2 text-xs bg-white/[0.02] border border-white/[0.04] rounded-lg text-slate-400 cursor-default"
        />
        <p className="text-[10px] text-slate-600">{t.settings.hotkeyNotCustomizable}</p>
      </div>

      {/* Theme */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-medium text-slate-400">{t.settings.theme}</label>
        <div className="flex gap-1.5">
          {(['light', 'dark', 'system'] as const).map((theme) => (
            <button
              key={theme}
              onClick={() => onChange({ theme })}
              className={cn(
                "flex-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors",
                config.theme === theme
                  ? "bg-white/[0.08] text-slate-200"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"
              )}
            >
              {theme === 'light' ? t.settings.themeLight : theme === 'dark' ? t.settings.themeDark : t.settings.themeSystem}
            </button>
          ))}
        </div>
      </div>

      {/* Close After Copy */}
      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={config.closeAfterCopy}
          onChange={(e) => onChange({ closeAfterCopy: e.target.checked })}
          className="w-3.5 h-3.5 rounded border-white/10 bg-white/5 text-indigo-500 focus:ring-0"
        />
        <span className="text-[11px] text-slate-400">{t.settings.closeAfterCopy}</span>
      </label>

      {/* Font Size */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-medium text-slate-400">
          {t.settings.fontSize}: {config.fontSize}px
        </label>
        <input
          type="range"
          min="12"
          max="20"
          value={config.fontSize}
          onChange={(e) => onChange({ fontSize: parseInt(e.target.value) })}
          className="w-full accent-indigo-500 h-1"
        />
      </div>

      {/* Language */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-medium text-slate-400">{t.settings.language}</label>
        <div className="flex gap-1.5">
          {([{ value: 'zh-CN', label: '中文' }, { value: 'en', label: 'English' }] as const).map((lang) => (
            <button
              key={lang.value}
              onClick={() => onChange({ language: lang.value })}
              className={cn(
                "flex-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors",
                config.language === lang.value
                  ? "bg-white/[0.08] text-slate-200"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"
              )}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// API Settings Tab
function APISettings({ 
  config, 
  onChange 
}: { 
  config: AppConfig['api']; 
  onChange: (updates: Partial<AppConfig['api']>) => void;
}) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const DEFAULT_BASE_URLS: Record<string, string> = {
    // 国际主流厂商
    openai: "https://api.openai.com/v1",
    anthropic: "https://api.anthropic.com",
    gemini: "https://generativelanguage.googleapis.com/v1beta/openai",
    mistral: "https://api.mistral.ai/v1",
    grok: "https://api.x.ai/v1",
    cohere: "https://api.cohere.com/v1",
    perplexity: "https://api.perplexity.ai",
    openrouter: "https://openrouter.ai/api/v1",
    // 国内厂商
    deepseek: "https://api.deepseek.com/v1",
    moonshot: "https://api.moonshot.cn/v1",
    zhipu: "https://open.bigmodel.cn/api/paas/v4",
    ernie: "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat",
    qwen: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    minimax: "https://api.minimaxi.com/v1",
    yi: "https://api.lingyiwanwu.com/v1",
    doubao: "https://ark.cn-beijing.volces.com/api/v3",
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const { aiService } = await import("../../lib/services");
      const result = await aiService.testConnection(config);
      setTestResult(result);
    } catch (err) {
      setTestResult({ success: false, message: "测试失败" });
    }
    setTesting(false);
  };

  return (
    <div className="space-y-4">
      {/* Provider */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-medium text-slate-400">API 提供商</label>
        <select
          value={config.provider}
          onChange={(e) => {
            const newProvider = e.target.value as AppConfig['api']['provider'];
            // 自动更新模型和清空 Base URL
            const updates: Partial<AppConfig['api']> = { provider: newProvider };
            if (PROVIDER_MODELS[newProvider] && PROVIDER_MODELS[newProvider]!.length > 0) {
              updates.model = PROVIDER_MODELS[newProvider]![0];
            }
            // 清空自定义 Base URL，让用户使用默认值
            updates.baseUrl = undefined;
            onChange(updates);
          }}
          className="w-full px-2.5 py-2 text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg text-slate-200 focus:outline-none focus:border-white/10"
        >
          <optgroup label="国际主流厂商">
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic (Claude)</option>
            <option value="gemini">Google Gemini</option>
            <option value="mistral">Mistral AI</option>
            <option value="grok">xAI Grok</option>
            <option value="cohere">Cohere</option>
            <option value="perplexity">Perplexity</option>
            <option value="openrouter">OpenRouter</option>
          </optgroup>
          <optgroup label="国内厂商">
            <option value="deepseek">DeepSeek (深度求索)</option>
            <option value="moonshot">Moonshot (月之暗面)</option>
            <option value="zhipu">Zhipu (智谱 AI)</option>
            <option value="ernie">Baidu ERNIE (百度文心)</option>
            <option value="qwen">Qwen (通义千问)</option>
            <option value="minimax">MiniMax</option>
            <option value="yi">Yi (零一万物)</option>
            <option value="doubao">Doubao (豆包)</option>
          </optgroup>
          <optgroup label="其他">
            <option value="custom">自定义</option>
          </optgroup>
        </select>
      </div>

      {/* API Key */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-medium text-slate-400">API Key</label>
        <input
          type="password"
          value={config.apiKey}
          onChange={(e) => onChange({ apiKey: e.target.value })}
          placeholder="sk-..."
          className="w-full px-2.5 py-2 text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/10"
        />
      </div>

      {/* Model Selection - 输入框 + 下拉按钮 */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-medium text-slate-400">模型</label>

        <div className="flex gap-1.5">
          {/* 输入框 */}
          <input
            value={config.model}
            onChange={(e) => onChange({ model: e.target.value })}
            placeholder="请输入或选择模型"
            className="flex-1 px-2.5 py-2 text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/10"
          />
          {/* 下拉选择按钮 - 只显示箭头 */}
          {PROVIDER_MODELS[config.provider] && PROVIDER_MODELS[config.provider]!.length > 0 && (
            <select
              value={config.model}
              onChange={(e) => onChange({ model: e.target.value })}
              className="px-0 py-2 text-[10px] bg-white/[0.03] border border-white/[0.06] rounded-lg text-transparent focus:outline-none focus:border-white/10 w-8 cursor-pointer appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMWw1IDVsNS01IiBzdHJva2U9IiM5NDk0OTQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')] bg-[length:10px_6px] bg-[center] bg-no-repeat"
            >
              {PROVIDER_MODELS[config.provider]?.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          )}
        </div>

        <p className="text-[10px] text-slate-600">
          {PROVIDER_MODELS[config.provider] && PROVIDER_MODELS[config.provider]!.length > 0
            ? '手动输入或点击右侧按钮选择'
            : '请手动输入模型名称'
          }
        </p>
      </div>

      {/* Base URL - always show, with default hint */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-medium text-slate-400">
          Base URL <span className="text-slate-600">(可选，留空使用默认)</span>
        </label>
        <input
          value={config.baseUrl || ''}
          onChange={(e) => onChange({ baseUrl: e.target.value })}
          placeholder={DEFAULT_BASE_URLS[config.provider] || "https://api.example.com/v1"}
          className="w-full px-2.5 py-2 text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/10"
        />
      </div>

      {/* Temperature */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-medium text-slate-400">
          Temperature: {config.temperature}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={config.temperature}
          onChange={(e) => onChange({ temperature: parseFloat(e.target.value) })}
          className="w-full accent-indigo-500 h-1"
        />
      </div>

      {/* Max Tokens */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-medium text-slate-400">Max Tokens</label>
        <input
          type="number"
          value={config.maxTokens}
          onChange={(e) => onChange({ maxTokens: parseInt(e.target.value) || 2000 })}
          className="w-full px-2.5 py-2 text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg text-slate-200 focus:outline-none focus:border-white/10"
        />
      </div>

      {/* Test Connection */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleTestConnection}
          disabled={testing || !config.apiKey}
          className="px-2.5 py-1.5 text-[11px] text-slate-500 hover:text-slate-300 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {testing ? "测试中..." : "测试连接"}
        </button>
        {testResult && (
          <span className={cn(
            "text-[11px]",
            testResult.success ? "text-green-400" : "text-red-400"
          )}>
            {testResult.message}
          </span>
        )}
      </div>
    </div>
  );
}

// 预设模板 - 帮助用户快速创建
const PRESET_TEMPLATES: { name: string; icon: string; description: string; systemPrompt: string; temperature: number }[] = [
  {
    name: '从空白开始',
    icon: '📝',
    description: '自定义你的润色风格',
    systemPrompt: '',
    temperature: 0.7,
  },
  {
    name: '学术论文',
    icon: '🎓',
    description: '学术风格，严谨专业',
    systemPrompt: `你是一位学术写作专家。请将用户的输入改写为学术论文风格的 Prompt。

要求：
1. 使用正式、客观的学术语言
2. 结构清晰，逻辑严密
3. 避免口语化表达
4. 适当使用专业术语
5. 保持简洁精炼

直接输出改写后的 Prompt，不要解释。`,
    temperature: 0.5,
  },
  {
    name: '创意写作',
    icon: '✨',
    description: '富有创意和想象力',
    systemPrompt: `你是一位创意写作大师。请将用户的输入转化为富有创意和感染力的 Prompt。

要求：
1. 使用生动、富有画面感的语言
2. 加入适当的修辞手法
3. 激发想象力和创造力
4. 保持开放性，留有发挥空间
5. 语言优美流畅

直接输出改写后的 Prompt，不要解释。`,
    temperature: 0.9,
  },
  {
    name: '代码助手',
    icon: '💻',
    description: '编程相关任务优化',
    systemPrompt: `你是一位资深软件工程师。请将用户的输入优化为清晰的编程相关 Prompt。

要求：
1. 明确技术栈和环境要求
2. 清晰描述功能需求
3. 列出边界条件和异常处理
4. 指定代码风格和最佳实践
5. 包含测试和文档要求（如适用）

直接输出改写后的 Prompt，不要解释。`,
    temperature: 0.6,
  },
  {
    name: '商业文案',
    icon: '💼',
    description: '营销和商业沟通',
    systemPrompt: `你是一位资深商业文案专家。请将用户的输入改写为专业的商业 Prompt。

要求：
1. 突出价值主张和利益点
2. 使用有说服力的语言
3. 结构清晰，重点突出
4. 适合目标受众
5. 行动导向

直接输出改写后的 Prompt，不要解释。`,
    temperature: 0.7,
  },
  {
    name: '简洁精炼',
    icon: '🎯',
    description: '去除冗余，直击要点',
    systemPrompt: `你是一位精简表达专家。请将用户的输入精简为最简洁有效的 Prompt。

要求：
1. 删除所有冗余词汇
2. 保留核心信息
3. 使用简短有力的句子
4. 结构紧凑
5. 一目了然

直接输出改写后的 Prompt，不要解释。`,
    temperature: 0.5,
  },
];

// Polish Settings Tab
function PolishSettings({ 
  config,
  onChange,
  onOpenAICreator,
}: { 
  config: AppConfig;
  onChange: (updates: Partial<AppConfig['polish']>) => void;
  onOpenAICreator?: () => void;
}) {
  const [editingPreset, setEditingPreset] = useState<PolishPreset | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const allPresets = [...BUILT_IN_PRESETS, ...config.polish.presets.filter(p => !p.isBuiltIn)];
  const customPresets = config.polish.presets.filter(p => !p.isBuiltIn);
  const selectedPreset = allPresets.find(p => p.id === config.polish.currentPreset) || allPresets[0];

  const handleCreatePreset = () => {
    setShowTemplates(true);
  };

  const handleSelectTemplate = (template: typeof PRESET_TEMPLATES[0]) => {
    setShowTemplates(false);
    setIsCreating(true);
    setEditingPreset({
      id: `custom-${Date.now()}`,
      name: template.name === '从空白开始' ? '' : template.name,
      description: template.description,
      icon: template.icon,
      systemPrompt: template.systemPrompt,
      isBuiltIn: false,
      isDefault: false,
      temperature: template.temperature,
    });
  };

  const handleSavePreset = () => {
    if (!editingPreset || !editingPreset.name.trim()) return;
    
    const newPresets = isCreating
      ? [...config.polish.presets, editingPreset]
      : config.polish.presets.map(p => p.id === editingPreset.id ? editingPreset : p);
    
    onChange({ presets: newPresets });
    setEditingPreset(null);
    setIsCreating(false);
  };

  const handleDeletePreset = (presetId: string) => {
    const newPresets = config.polish.presets.filter(p => p.id !== presetId);
    onChange({ 
      presets: newPresets,
      currentPreset: config.polish.currentPreset === presetId ? 'default' : config.polish.currentPreset
    });
  };

  // 模板选择模式
  if (showTemplates) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">选择模板</h3>
          <button 
            onClick={() => setShowTemplates(false)}
            className="text-xs text-slate-500 hover:text-slate-300"
          >
            取消
          </button>
        </div>
        
        <p className="text-[11px] text-slate-500">
          选择一个模板快速开始，或从空白创建
        </p>

        <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto">
          {/* AI Power */}
          {onOpenAICreator && (
            <button
              onClick={() => {
                setShowTemplates(false);
                onOpenAICreator();
              }}
              className="flex flex-col items-start gap-1.5 p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.12] rounded-lg transition-all text-left group col-span-2"
            >
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-slate-400 group-hover:text-slate-200" />
                <span className="text-xs font-medium text-slate-300 group-hover:text-slate-100">
                  AI 生成
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                描述风格，AI 生成润色用的 System Prompt
              </p>
            </button>
          )}

          {PRESET_TEMPLATES.map((template, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectTemplate(template)}
              className="flex flex-col items-start gap-1.5 p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.12] rounded-lg transition-all text-left group"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{template.icon}</span>
                <span className="text-xs font-medium text-slate-300 group-hover:text-slate-100">
                  {template.name}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 line-clamp-2">
                {template.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 编辑模式
  if (editingPreset) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">
            {isCreating ? '新建预设' : '编辑预设'}
          </h3>
          <button 
            onClick={() => { setEditingPreset(null); setIsCreating(false); }}
            className="text-xs text-slate-500 hover:text-slate-300"
          >
            取消
          </button>
        </div>

        <div className="flex gap-2">
          <div className="w-14">
            <label className="block text-[11px] font-medium text-slate-400 mb-1">图标</label>
            <input
              value={editingPreset.icon || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingPreset({ ...editingPreset, icon: e.target.value })}
              className="w-full px-2 py-2 text-center text-base bg-white/[0.03] border border-white/[0.06] rounded-lg"
              maxLength={2}
            />
          </div>
          <div className="flex-1 space-y-1.5">
            <label className="block text-[11px] font-medium text-slate-400">名称</label>
            <input
              value={editingPreset.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingPreset({ ...editingPreset, name: e.target.value })}
              placeholder="我的预设"
              className="w-full px-2.5 py-2 text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/10"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[11px] font-medium text-slate-400">描述（可选）</label>
          <input
            value={editingPreset.description || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingPreset({ ...editingPreset, description: e.target.value })}
            placeholder="简短描述"
            className="w-full px-2.5 py-2 text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/10"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[11px] font-medium text-slate-400">System Prompt</label>
          <textarea
            value={editingPreset.systemPrompt}
            onChange={(e) => setEditingPreset({ ...editingPreset, systemPrompt: e.target.value })}
            placeholder="你是一个..."
            rows={5}
            className="w-full px-2.5 py-2 text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/10 resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[11px] font-medium text-slate-400">
            Temperature: {editingPreset.temperature}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={editingPreset.temperature || 0.7}
            onChange={(e) => setEditingPreset({ ...editingPreset, temperature: parseFloat(e.target.value) })}
            className="w-full accent-indigo-500 h-1"
          />
        </div>

        <button 
          onClick={handleSavePreset} 
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-indigo-500/80 text-white rounded-lg hover:bg-indigo-500 transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
          保存
        </button>
      </div>
    );
  }

  // 列表模式
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-400">润色预设</span>
        <button 
          onClick={handleCreatePreset}
          className="flex items-center gap-1 px-2 py-1 text-[10px] text-slate-500 hover:text-slate-300 rounded hover:bg-white/5 transition-colors"
        >
          <Plus className="w-3 h-3" />
          新建
        </button>
      </div>

      {/* 预设列表 */}
      <div className="space-y-1 max-h-[200px] overflow-y-auto">
        {/* 内置预设 */}
        <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider px-2 py-1">
          内置预设
        </div>
        {BUILT_IN_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onChange({ currentPreset: preset.id })}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-colors",
              config.polish.currentPreset === preset.id
                ? "bg-indigo-500/15 text-indigo-300"
                : "text-slate-400 hover:bg-white/5"
            )}
          >
            <span className="text-sm">{preset.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{preset.name}</div>
            </div>
            {config.polish.currentPreset === preset.id && (
              <Check className="w-3.5 h-3.5 text-indigo-400" />
            )}
          </button>
        ))}

        {/* 自定义预设 */}
        {customPresets.length > 0 && (
          <>
            <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider px-2 py-1 mt-2">
              自定义预设
            </div>
            {customPresets.map((preset) => (
              <div
                key={preset.id}
                className={cn(
                  "flex items-center gap-2 px-2 py-2 rounded-lg transition-colors group",
                  config.polish.currentPreset === preset.id
                    ? "bg-indigo-500/15"
                    : "hover:bg-white/5"
                )}
              >
                <button
                  onClick={() => onChange({ currentPreset: preset.id })}
                  className="flex-1 flex items-center gap-2 text-left"
                >
                  <span className="text-sm">{preset.icon || '📝'}</span>
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      "text-xs font-medium truncate",
                      config.polish.currentPreset === preset.id ? "text-indigo-300" : "text-slate-400"
                    )}>
                      {preset.name}
                    </div>
                  </div>
                </button>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingPreset(preset)}
                    className="p-1 text-slate-500 hover:text-slate-300 rounded"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeletePreset(preset.id)}
                    className="p-1 text-slate-500 hover:text-red-400 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                {config.polish.currentPreset === preset.id && (
                  <Check className="w-3.5 h-3.5 text-indigo-400" />
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {/* 当前预设预览 */}
      <div className="space-y-2 pt-3 border-t border-white/5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-slate-400">当前: {selectedPreset?.name}</label>
          <span className="text-[10px] text-slate-500">temp: {selectedPreset?.temperature}</span>
        </div>
        <div className="p-2 bg-white/[0.02] rounded-lg border border-white/5 max-h-[100px] overflow-y-auto">
          <pre className="text-[11px] text-slate-500 whitespace-pre-wrap font-sans leading-relaxed">
            {selectedPreset?.systemPrompt || ''}
          </pre>
        </div>
      </div>
    </div>
  );
}

// Storage Settings Tab
function StorageSettings({ 
  config, 
  onChange 
}: { 
  config: AppConfig['storage']; 
  onChange: (updates: Partial<AppConfig['storage']>) => void;
}) {
  const [stats, setStats] = useState({ favorites: 0, templates: 0 });
  const [initError, setInitError] = useState<string | null>(null);
  const [initSuccess, setInitSuccess] = useState(false);

  // Load stats on mount
  useEffect(() => {
    const loadStats = async () => {
      try {
        const [favs, temps] = await Promise.all([
          promptService.getFavorites(),
          promptService.getTemplates()
        ]);
        setStats({ favorites: favs.length, templates: temps.length });
      } catch (err) {
        console.error("Failed to load stats:", err);
      }
    };
    loadStats();
  }, []);

  const handleChooseDirectory = async () => {
    try {
      setInitError(null);
      setInitSuccess(false);
      
      const selected = await openDialog({
        directory: true,
        multiple: false,
      });
      
      if (typeof selected !== "string" || !selected) return;

      console.log("[PromptFlow] Selected storage path:", selected);
      
      // Call backend to initialize repository with conflict detection
      const result = await promptService.initRepository(selected);
      console.log("[PromptFlow] initRepository result:", result);
      
      if (result.success) {
        onChange({ path: selected });
        setInitSuccess(true);
        console.log("[PromptFlow] Storage path updated, reloading...");
        // Reload to pick up new data
        setTimeout(() => window.location.reload(), 500);
      } else {
        setInitError(result.error || "初始化失败");
      }
    } catch (err) {
      console.error("Failed to initialize repository:", err);
      setInitError(err instanceof Error ? err.message : "初始化失败");
    }
  };

  const handleOpenDirectory = async () => {
    try {
      const dir = await promptService.getDataDirectory();
      console.log("Opening directory:", dir);
      // Use revealItemInDir to open in Finder, with config.json as the target
      await revealItemInDir(dir + "/config.json");
    } catch (err) {
      console.error("Failed to open directory:", err);
      // Fallback: try openPath
      try {
        const dir = await promptService.getDataDirectory();
        await openPath(dir);
      } catch (e) {
        console.error("Fallback also failed:", e);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Storage Path */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-medium text-slate-400">Prompt 仓库位置</label>
        <div className="flex gap-1.5">
          <input
            value={config.path}
            readOnly
            className="flex-1 px-2.5 py-2 text-xs bg-white/[0.02] border border-white/[0.04] rounded-lg text-slate-400 cursor-default"
          />
          <button
            onClick={handleChooseDirectory}
            className="px-2.5 py-2 text-[11px] text-slate-400 hover:text-slate-200 bg-white/[0.03] border border-white/[0.06] rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            选择
          </button>
        </div>
        <p className="text-[10px] text-slate-600">
          选择文件夹后自动创建 config.json、favorites/、templates/
        </p>
      </div>

      {/* Error/Success Message */}
      {initError && (
        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-[11px] text-red-400">{initError}</p>
        </div>
      )}
      {initSuccess && (
        <div className="p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-[11px] text-green-400">仓库初始化成功</p>
        </div>
      )}

      {/* Data Stats */}
      <div className="flex gap-3 p-2.5 bg-white/[0.02] rounded-lg border border-white/[0.04]">
        <div className="flex-1 text-center">
          <div className="text-lg font-semibold text-slate-200">{stats.favorites}</div>
          <div className="text-[10px] text-slate-500">常用</div>
        </div>
        <div className="w-px bg-white/[0.06]"></div>
        <div className="flex-1 text-center">
          <div className="text-lg font-semibold text-slate-200">{stats.templates}</div>
          <div className="text-[10px] text-slate-500">模板</div>
        </div>
      </div>

      {/* Open Directory */}
      <button
        onClick={handleOpenDirectory}
        className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2 text-[11px] text-slate-400 hover:text-slate-200 bg-white/[0.03] border border-white/[0.06] rounded-lg hover:bg-white/[0.06] transition-colors"
      >
        <FolderOpen className="w-3.5 h-3.5" />
        在 Finder 中打开
      </button>
    </div>
  );
}
