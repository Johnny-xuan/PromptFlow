import { useState, useRef, useCallback, useEffect } from "react";
import { TitleBar } from "./components/layout/TitleBar";
import { InputSection } from "./components/sections/InputSection";
import { OutputSection } from "./components/sections/OutputSection";
import { PromptListDialog, TemplateDialog, SaveDialog, SettingsDialog, QuickAddPromptDialog, OnboardingDialog } from "./components/dialogs";
import type { PromptItem, AppConfig } from "./types";
import { BUILT_IN_PRESETS } from "./types";
import type { SavePromptData } from "./components/dialogs";
import { configService, promptService, aiService, analyzeIntent } from "./lib/services";
import type { ClarificationQuestion, UserSelection } from "./types/intent";
import { I18nProvider } from "./lib/i18n/context";
import { getTranslations } from "./lib/i18n";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { openPath } from "@tauri-apps/plugin-opener";
import { Modal, Button } from "./components/ui";

const defaultConfig: AppConfig = {
  ui: {
    hotkey: "Alt+Space",
    closeAfterCopy: true,
    rememberPosition: true,
    windowPosition: "center",
    theme: "dark",
    fontSize: 14,
    opacity: 100,
    language: "en",
  },
  api: {
    provider: "deepseek",
    apiKey: "",
    baseUrl: "",
    model: "deepseek-chat",
    temperature: 0.7,
    maxTokens: 2000,
  },
  polish: {
    currentPreset: "default",
    presets: [],
  },
  storage: {
    path: "",  // 空，用户通过引导设置
    format: "markdown",
  },
  onboardingCompleted: false,
};

function App() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isPolishing, setIsPolishing] = useState(false);
  const [checkerEnabled, setCheckerEnabled] = useState(false);
  
  // Checker 状态 - 一次性显示所有问题
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [clarificationQuestions, setClarificationQuestions] = useState<ClarificationQuestion[]>([]);
  const [userSelections, setUserSelections] = useState<UserSelection[]>([]);
  
  // 润色 Agent 对话历史
  const [polishChatHistory, setPolishChatHistory] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [isChatting, setIsChatting] = useState(false);
  
  // Dialog states
  const [showFavorites, setShowFavorites] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddFolder, setQuickAddFolder] = useState<"favorites" | "templates">("favorites");
  const [showAccessibilityPrompt, setShowAccessibilityPrompt] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingResetSignal, setOnboardingResetSignal] = useState(0);
  
  // Data states
  const [favorites, setFavorites] = useState<PromptItem[]>([]);
  const [templates, setTemplates] = useState<PromptItem[]>([]);
  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const [currentPreset, setCurrentPreset] = useState("default");
  const [splitRatio, setSplitRatio] = useState(50); // 输入区占比百分比
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const openQuickAdd = (folder: "favorites" | "templates") => {
    setQuickAddFolder(folder);
    setShowQuickAdd(true);
  };

  const handleQuickAddSave = async (data: { title: string; content: string; tags: string[]; description?: string; folder: "favorites" | "templates" }) => {
    await promptService.createPrompt({
      title: data.title,
      content: data.content,
      tags: data.tags,
      description: data.description,
      folder: data.folder,
    });

    if (data.folder === "favorites") {
      setFavorites(await promptService.getFavorites());
    } else {
      setTemplates(await promptService.getTemplates());
    }
  };

  // Load real config & prompts
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const loadedConfig = await configService.loadConfig();
        console.log("[PromptFlow] Config loaded:", loadedConfig.api.provider, "apiKey:", loadedConfig.api.apiKey ? "***" : "EMPTY");
        if (!cancelled) {
          setConfig(loadedConfig);
          setCurrentPreset(loadedConfig.polish.currentPreset || "default");
          setShowOnboarding(!loadedConfig.onboardingCompleted);
        }
      } catch (err) {
        console.error("Failed to load config:", err);
        // 加载失败也显示引导
        if (!cancelled) {
          setShowOnboarding(true);
        }
      }

      try {
        const [fav, temp] = await Promise.all([
          promptService.getFavorites(),
          promptService.getTemplates(),
        ]);
        if (!cancelled) {
          setFavorites(fav);
          setTemplates(temp);
        }
      } catch (err) {
        console.error("Failed to load prompts:", err);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Onboarding 预览模式：加 ?onboarding=1 或 #onboarding
  useEffect(() => {
    try {
      const search = window.location.search || "";
      const hash = window.location.hash || "";
      const params = new URLSearchParams(search);
      const shouldPreview = params.get("onboarding") === "1" || hash.includes("onboarding");
      if (shouldPreview) {
        setShowOnboarding(true);
        setOnboardingResetSignal((v) => v + 1);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let unlisten: UnlistenFn | null = null;

    (async () => {
      try {
        unlisten = await listen("accessibility-permission-requested", () => {
          setShowAccessibilityPrompt(true);
        });
      } catch (err) {
        console.error("Failed to listen accessibility event:", err);
      }
    })();

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  // Sync current preset with config when config loads
  useEffect(() => {
    setCurrentPreset(config.polish.currentPreset || "default");
  }, [config.polish.currentPreset]);

  // Apply theme and font size
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme
    let theme = config.ui.theme;
    if (theme === 'system') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    root.setAttribute('data-theme', theme);
    
    // Apply font size
    root.style.setProperty('--app-font-size', `${config.ui.fontSize}px`);
  }, [config.ui.theme, config.ui.fontSize]);

  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const percentage = (y / rect.height) * 100;
    // 限制在 20% - 80% 之间
    setSplitRatio(Math.min(80, Math.max(20, percentage)));
  }, []);

  // 获取当前激活的预设
  const getActivePreset = useCallback(() => {
    const allPresets = [...BUILT_IN_PRESETS, ...config.polish.presets];
    return allPresets.find(p => p.id === currentPreset) || allPresets[0];
  }, [config.polish.presets, currentPreset]);

  // 执行润色（内部函数），支持对话历史
  const doPolish = async (textToPolish: string, chatHistory: Array<{ role: 'user' | 'assistant', content: string }> = []) => {
    const activePreset = getActivePreset();
    const result = await aiService.polish({
      input: textToPolish,
      preset: activePreset,
      config: config.api,
      chatHistory,
      language: config.ui.language,
    });

    if (result.error) {
      const t = getTranslations(config.ui.language);
      setOutput(`${t.messages.errorPrefix}: ${result.error}`);
    } else {
      setOutput(result.output);
      // 记录对话历史
      const newHistory = [
        ...chatHistory,
        { role: 'user' as const, content: textToPolish },
        { role: 'assistant' as const, content: result.output },
      ];
      setPolishChatHistory(newHistory);
    }
    setIsPolishing(false);
  };

  // 分析意图 - 一次性生成所有问题
  const runAnalysis = async () => {
    const activePreset = getActivePreset();
    const textToPolish = input.trim();

    setIsAnalyzing(true);
    
    const result = await analyzeIntent(
      { rawInput: textToPolish, preset: activePreset },
      config.api
    );
    
    setIsAnalyzing(false);

    if (!result.success) {
      setClarificationQuestions([]);
      setUserSelections([]);
      const t = getTranslations(config.ui.language);
      setOutput(`${t.messages.errorPrefix}: ${result.error || t.messages.intentAnalysisFailed}`);
      return;
    }

    if (result.needsClarification && result.questions && result.questions.length > 0) {
      // 需要澄清，显示所有问题
      setClarificationQuestions(result.questions);
      setUserSelections([]);
      return;
    }
    
    // 意图已清晰，直接润色
    setClarificationQuestions([]);
    setIsPolishing(true);
    await doPolish(textToPolish);
  };

  // 点击润色按钮 - 开启新对话
  const handlePolish = async () => {
    if (!input.trim()) return;

    // 清空对话历史，开启新对话
    setPolishChatHistory([]);

    // 如果开启了 Checker，先分析意图
    if (checkerEnabled) {
      setOutput("");
      setClarificationQuestions([]);
      setUserSelections([]);
      await runAnalysis();
      return;
    }

    // 未开启 Checker，直接润色
    setIsPolishing(true);
    setOutput("");
    await doPolish(input.trim());
  };

  // 继续对话 - 基于历史上下文修改润色结果
  const handleContinueChat = async (message: string) => {
    if (!message.trim()) return;
    
    setIsChatting(true);
    setIsPolishing(true);
    
    // 带上历史对话继续润色
    await doPolish(message.trim(), polishChatHistory);
    
    setIsChatting(false);
  };

  // 用户在卡片上选择选项
  const handleClarificationSelect = (questionId: string, optionId: string, customInput?: string, selectedIds?: string[]) => {
    setUserSelections(prev => {
      const existing = prev.filter(s => s.questionId !== questionId);
      return [...existing, { 
        questionId, 
        selectedOptionId: optionId, 
        selectedOptionIds: selectedIds,
        customInput 
      }];
    });
  };

  // 用户确认所有问题，开始润色
  const handleClarificationConfirm = async () => {
    if (clarificationQuestions.length === 0) return;

    // 将用户选择转换为上下文文本
    const contextText = userSelections.map(sel => {
      const question = clarificationQuestions.find(q => q.id === sel.questionId);
      if (!question) return '';
      
      const isMultiple = question.type === 'multiple';
      let answerText = '';
      
      if (isMultiple && sel.selectedOptionIds) {
        const labels = sel.selectedOptionIds
          .map(id => {
            if (id === 'other' && sel.customInput) return sel.customInput;
            return question.options.find(o => o.id === id)?.label || '';
          })
          .filter(Boolean);
        answerText = labels.join('、');
      } else {
        const option = question.options.find(o => o.id === sel.selectedOptionId);
        answerText = option?.allowCustomInput && sel.customInput 
          ? sel.customInput 
          : option?.label || '';
      }
      
      return `${question.question.replace('？', '').replace('?', '')}: ${answerText}`;
    }).filter(Boolean).join('\n');

    // 清空问题
    setClarificationQuestions([]);
    setUserSelections([]);
    
    // 开始润色
    setIsPolishing(true);
    setOutput("");
    
    if (contextText) {
      const combinedPrompt = `${input.trim()}\n\n补充说明：\n${contextText}`;
      await doPolish(combinedPrompt);
    } else {
      await doPolish(input.trim());
    }
  };

  // 用户跳过澄清，直接润色
  const handleClarificationSkip = async () => {
    setClarificationQuestions([]);
    setUserSelections([]);
    
    setIsPolishing(true);
    setOutput("");
    await doPolish(input.trim());
  };

  const handleSelectFavorite = (prompt: PromptItem) => {
    setInput(prompt.content);
    setOutput(""); // 清空输出
    promptService.incrementUseCount(prompt.id, "favorites").then(() => {
      promptService.getFavorites().then(setFavorites).catch((err) => {
        console.error("Failed to refresh favorites:", err);
      });
    }).catch((err) => {
      console.error("Failed to increment use count:", err);
    });
    setShowFavorites(false);
  };

  const handleApplyTemplate = (result: string) => {
    setInput(result);
    setOutput(""); // 清空输出
    // Note: Template use count is incremented in TemplateDialog usually, or we can track it here if we had the ID
    setShowTemplates(false);
  };

  // 当输入清空时，自动清空输出
  const handleInputChange = (value: string) => {
    setInput(value);
    if (!value.trim()) {
      setOutput("");
    }
  };

  const handleSave = async (data: SavePromptData) => {
    try {
      await promptService.createPrompt({
        title: data.title,
        content: data.content,
        tags: data.tags,
        description: data.description,
        folder: data.folder,
      });

      // refresh list
      if (data.folder === "favorites") {
        setFavorites(await promptService.getFavorites());
      } else {
        setTemplates(await promptService.getTemplates());
      }
    } catch (err) {
      console.error("Failed to save prompt:", err);
    }
  };

  // 引导完成处理
  const handleOnboardingComplete = async (partialConfig: Partial<AppConfig>) => {
    const newConfig = {
      ...config,
      ...partialConfig,
      api: { ...config.api, ...partialConfig.api },
      storage: { ...config.storage, ...partialConfig.storage },
      onboardingCompleted: true,  // 标记引导完成
    };
    setConfig(newConfig);
    try {
      await configService.saveConfig(newConfig);
    } catch (err) {
      console.error("Failed to save config after onboarding:", err);
    }
    setShowOnboarding(false);
  };

  const handleSaveConfig = async (newConfig: AppConfig) => {
    setConfig(newConfig);
    try {
      await configService.saveConfig(newConfig);
    } catch (err) {
      console.error("Failed to save config:", err);
    }
  };

  const handlePresetChange = (presetId: string) => {
    setCurrentPreset(presetId);
    const nextConfig: AppConfig = {
      ...config,
      polish: {
        ...config.polish,
        currentPreset: presetId,
      },
    };
    setConfig(nextConfig);
    configService.saveConfig(nextConfig).catch((err) => {
      console.error("Failed to persist preset change:", err);
    });
  };

  // 添加全局鼠标事件监听
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <I18nProvider language={config.ui.language}>
    <div className="w-full h-full floating-window flex flex-col">
      <TitleBar 
        onSettingsClick={() => setShowSettings(true)} 
        checkerEnabled={checkerEnabled}
        onCheckerToggle={setCheckerEnabled}
      />
      
      <main ref={containerRef} className="flex-1 flex flex-col min-h-0">
        {/* Input Section */}
        <div style={{ height: `${splitRatio}%` }} className="flex flex-col min-h-0">
          <InputSection 
            value={input} 
            onChange={handleInputChange}
            onPolish={handlePolish}
            onFavorites={() => setShowFavorites(true)}
            onTemplates={() => setShowTemplates(true)}
            isPolishing={isPolishing}
            isAnalyzing={isAnalyzing}
            presets={[...BUILT_IN_PRESETS, ...config.polish.presets]}
            currentPreset={currentPreset}
            onPresetChange={handlePresetChange}
            clarificationQuestions={clarificationQuestions}
            userSelections={userSelections}
            onClarificationSelect={handleClarificationSelect}
            onClarificationConfirm={handleClarificationConfirm}
            onClarificationSkip={handleClarificationSkip}
          />
        </div>

        {/* Draggable Divider */}
        <div 
          onMouseDown={handleMouseDown}
          className="h-1 bg-white/[0.04] hover:bg-indigo-500/30 cursor-row-resize transition-colors shrink-0 relative group"
        >
          <div className="absolute inset-x-0 -top-1 -bottom-1" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-0.5 bg-white/10 rounded-full group-hover:bg-indigo-400/50 transition-colors" />
        </div>

        {/* Output Section */}
        <div style={{ height: `${100 - splitRatio}%` }} className="flex flex-col min-h-0">
          <OutputSection 
            content={output} 
            isVisible={true}
            onSave={() => setShowSave(true)}
            onChange={setOutput}
            onContinueChat={handleContinueChat}
            isChatting={isChatting}
          />
        </div>
      </main>

      {/* Dialogs */}
      <PromptListDialog
        isOpen={showFavorites}
        onClose={() => setShowFavorites(false)}
        prompts={favorites}
        onSelect={handleSelectFavorite}
        onAdd={() => openQuickAdd("favorites")}
      />

      <TemplateDialog
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        templates={templates}
        currentInput={input}
        onApply={handleApplyTemplate}
        onTemplatesRefresh={async () => {
          setTemplates(await promptService.getTemplates());
        }}
        onAdd={() => openQuickAdd("templates")}
      />

      <SaveDialog
        isOpen={showSave}
        onClose={() => setShowSave(false)}
        content={output || input}
        onSave={handleSave}
      />

      <SettingsDialog
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        config={config}
        onSave={handleSaveConfig}
      />

      <QuickAddPromptDialog
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        folder={quickAddFolder}
        onSave={handleQuickAddSave}
      />

      <OnboardingDialog
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
        currentConfig={config}
        resetSignal={onboardingResetSignal}
      />

      {(() => {
        const t = getTranslations(config.ui.language);
        return (
          <Modal
            isOpen={showAccessibilityPrompt}
            onClose={() => setShowAccessibilityPrompt(false)}
            title={t.messages.accessibilityRequired}
            size="md"
          >
            <div className="space-y-3">
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.messages.accessibilityDesc}
              </p>
              <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {t.messages.accessibilityHint}
                </p>
              </div>
              <p className="text-[11px] text-slate-500">
                {t.messages.accessibilityNote}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
                <Button variant="ghost" onClick={() => setShowAccessibilityPrompt(false)}>
                  {t.messages.later}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    openPath(
                      "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"
                    )
                  }
                >
                  {t.messages.openSettings}
                </Button>
              </div>
            </div>
          </Modal>
        );
      })()}
    </div>
    </I18nProvider>
  );
}

export default App;
