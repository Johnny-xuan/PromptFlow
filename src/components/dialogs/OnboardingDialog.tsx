import { useEffect, useState } from "react";
import { Modal } from "../ui/Modal";
import { FolderOpen, Key, ChevronRight, ChevronLeft, Check, ArrowRight } from "lucide-react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { promptService } from "../../lib/services";
import type { AppConfig } from "../../types";
import { useI18n } from "../../lib/i18n/context";

interface OnboardingDialogProps {
  isOpen: boolean;
  onComplete: (config: Partial<AppConfig>) => void;
  currentConfig: AppConfig;
  resetSignal?: number;
}

type Step = "welcome" | "storage" | "api" | "hotkey" | "done";

const STEPS: Step[] = ["welcome", "storage", "api", "hotkey", "done"];

export function OnboardingDialog({ isOpen, onComplete, currentConfig, resetSignal }: OnboardingDialogProps) {
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState<Step>("welcome");
  const [storagePath, setStoragePath] = useState(currentConfig.storage.path);
  const [apiKey, setApiKey] = useState(currentConfig.api.apiKey);
  const [provider, setProvider] = useState(currentConfig.api.provider);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setCurrentStep("welcome");
    setStoragePath(currentConfig.storage.path);
    setApiKey(currentConfig.api.apiKey);
    setProvider(currentConfig.api.provider);
    setError(null);
  }, [
    isOpen,
    resetSignal,
    currentConfig.storage.path,
    currentConfig.api.apiKey,
    currentConfig.api.provider,
  ]);

  const stepIndex = STEPS.indexOf(currentStep);

  const goNext = () => {
    const nextIndex = stepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
      setError(null);
    }
  };

  const goPrev = () => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
      setError(null);
    }
  };

  const handleChooseStorage = async () => {
    if (isSettingUp) return;
    try {
      setError(null);
      const selected = await openDialog({
        directory: true,
        multiple: false,
      });
      
      if (typeof selected === "string" && selected) {
        setIsSettingUp(true);
        const result = await promptService.initRepository(selected);
        if (result.success) {
          setStoragePath(selected);
          setError(null);
        } else {
          setError(result.error || t.messages.setupFailed);
        }
        setIsSettingUp(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.messages.selectFailed);
      setIsSettingUp(false);
    }
  };

  const handleComplete = () => {
    onComplete({
      storage: { ...currentConfig.storage, path: storagePath },
      api: { ...currentConfig.api, apiKey, provider },
    });
  };

  // Step indicator component
  const StepIndicator = () => (
    <div className="flex items-center gap-1.5">
      {STEPS.map((_, i) => (
        <div
          key={i}
          className={`h-1 rounded-full transition-all duration-300 ${
            i < stepIndex
              ? "w-6 bg-white/30"
              : i === stepIndex
              ? "w-8 bg-white"
              : "w-1.5 bg-white/10"
          }`}
        />
      ))}
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case "welcome":
        return (
          <div className="flex flex-col h-full">
            {/* Main content */}
            <div className="flex-1 flex flex-col justify-center px-10 py-8">
              <h1 className="text-[28px] font-semibold text-white tracking-tight mb-3">
                {t.onboarding.welcomeTitle}
              </h1>
              
              <p className="text-[15px] text-[#8B8B9E] leading-relaxed max-w-[320px]">
                {t.onboarding.welcomeDesc}
              </p>
              
              <div className="mt-8 space-y-3">
                <div className="flex items-center gap-3 text-[13px] text-[#6B6B7A]">
                  <div className="w-5 h-5 rounded bg-[#1A1A24] flex items-center justify-center">
                    <Check className="w-3 h-3 text-[#4ADE80]" />
                  </div>
                  <span>{t.onboarding.featureLocal}</span>
                </div>
                <div className="flex items-center gap-3 text-[13px] text-[#6B6B7A]">
                  <div className="w-5 h-5 rounded bg-[#1A1A24] flex items-center justify-center">
                    <Check className="w-3 h-3 text-[#4ADE80]" />
                  </div>
                  <span>{t.onboarding.featureHotkey}</span>
                </div>
                <div className="flex items-center gap-3 text-[13px] text-[#6B6B7A]">
                  <div className="w-5 h-5 rounded bg-[#1A1A24] flex items-center justify-center">
                    <Check className="w-3 h-3 text-[#4ADE80]" />
                  </div>
                  <span>{t.onboarding.featureAI}</span>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-10 pb-8">
              <button
                onClick={goNext}
                className="w-full h-11 bg-white text-[#0A0A0F] rounded-lg font-medium text-[14px] hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
              >
                {t.onboarding.startConfig}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        );

      case "storage":
        return (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-10 pt-8 pb-6 border-b border-white/[0.06]">
              <div className="flex items-center justify-between mb-4">
                <StepIndicator />
                <span className="text-[11px] text-[#6B6B7A] font-medium tracking-wider uppercase">
                  1 / 3
                </span>
              </div>
              <h2 className="text-[20px] font-semibold text-white">{t.onboarding.storageTitle}</h2>
              <p className="text-[13px] text-[#6B6B7A] mt-1">
                {t.onboarding.storageDesc}
              </p>
            </div>
            
            {/* Content */}
            <div className="flex-1 px-10 py-6">
              <div 
                onClick={handleChooseStorage}
                className={`
                  group relative p-4 rounded-lg border cursor-pointer transition-all
                  ${storagePath 
                    ? "bg-[#0F0F14] border-[#2A2A35]" 
                    : "bg-[#0A0A0F] border-white/[0.06] hover:border-white/[0.12]"
                  }
                  ${isSettingUp ? "opacity-50 pointer-events-none" : ""}
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    w-9 h-9 rounded-lg flex items-center justify-center shrink-0
                    ${storagePath ? "bg-[#4ADE80]/10" : "bg-white/[0.04]"}
                  `}>
                    {storagePath ? (
                      <Check className="w-4 h-4 text-[#4ADE80]" />
                    ) : (
                      <FolderOpen className="w-4 h-4 text-[#6B6B7A]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-white mb-1">
                      {storagePath ? t.onboarding.storageSelected : t.onboarding.storageChoose}
                    </div>
                    <div className="text-[12px] text-[#6B6B7A] font-mono truncate">
                      {isSettingUp 
                        ? t.onboarding.storageSetting 
                        : (storagePath || "~/Documents/PromptFlow")
                      }
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#6B6B7A] shrink-0 mt-2.5 group-hover:text-white/50 transition-colors" />
                </div>
              </div>
              
              {error && (
                <div className="mt-3 px-3 py-2 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20">
                  <p className="text-[12px] text-[#EF4444]">{error}</p>
                </div>
              )}
              
              <p className="mt-4 text-[12px] text-[#4B4B5A] leading-relaxed">
                {t.onboarding.storageHint}
              </p>
            </div>
            
            {/* Footer */}
            <div className="px-10 pb-8 flex items-center justify-between">
              <button
                onClick={goPrev}
                className="h-9 px-4 text-[13px] text-[#8B8B9E] hover:text-white transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                {t.onboarding.back}
              </button>
              <button
                onClick={goNext}
                className="h-9 px-5 bg-white text-[#0A0A0F] rounded-lg font-medium text-[13px] hover:bg-white/90 transition-colors flex items-center gap-1.5"
              >
                {t.onboarding.next}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        );

      case "api":
        return (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-10 pt-8 pb-6 border-b border-white/[0.06]">
              <div className="flex items-center justify-between mb-4">
                <StepIndicator />
                <span className="text-[11px] text-[#6B6B7A] font-medium tracking-wider uppercase">
                  2 / 3
                </span>
              </div>
              <h2 className="text-[20px] font-semibold text-white">{t.onboarding.apiTitle}</h2>
              <p className="text-[13px] text-[#6B6B7A] mt-1">
                {t.onboarding.apiDesc}
              </p>
            </div>
            
            {/* Content */}
            <div className="flex-1 px-10 py-6 space-y-5">
              {/* Provider selection */}
              <div>
                <label className="block text-[12px] text-[#6B6B7A] font-medium mb-2 uppercase tracking-wider">
                  Provider
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['deepseek', 'openai', 'anthropic', 'custom'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setProvider(p)}
                      className={`
                        h-9 rounded-lg text-[12px] font-medium transition-all border
                        ${provider === p 
                          ? "bg-white text-[#0A0A0F] border-white" 
                          : "bg-transparent text-[#8B8B9E] border-white/[0.06] hover:border-white/[0.12] hover:text-white"
                        }
                      `}
                    >
                      {p === 'deepseek' ? 'DeepSeek' : 
                       p === 'openai' ? 'OpenAI' : 
                       p === 'anthropic' ? 'Claude' : t.onboarding.custom}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* API Key input */}
              <div>
                <label className="block text-[12px] text-[#6B6B7A] font-medium mb-2 uppercase tracking-wider">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={`sk-...`}
                    className="w-full h-11 px-4 pr-10 bg-[#0A0A0F] border border-white/[0.06] rounded-lg text-[13px] text-white font-mono placeholder:text-[#3B3B4A] focus:outline-none focus:border-white/[0.15] transition-colors"
                  />
                  <Key className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3B3B4A]" />
                </div>
              </div>
              
              <div className="p-3 rounded-lg bg-[#0F0F14] border border-white/[0.04]">
                <p className="text-[12px] text-[#6B6B7A] leading-relaxed">
                  {t.onboarding.apiSkipHint}
                </p>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-10 pb-8 flex items-center justify-between">
              <button
                onClick={goPrev}
                className="h-9 px-4 text-[13px] text-[#8B8B9E] hover:text-white transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                {t.onboarding.back}
              </button>
              <button
                onClick={goNext}
                className="h-9 px-5 bg-white text-[#0A0A0F] rounded-lg font-medium text-[13px] hover:bg-white/90 transition-colors flex items-center gap-1.5"
              >
                {apiKey ? t.onboarding.next : t.onboarding.skip}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        );

      case "hotkey":
        return (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-10 pt-8 pb-6 border-b border-white/[0.06]">
              <div className="flex items-center justify-between mb-4">
                <StepIndicator />
                <span className="text-[11px] text-[#6B6B7A] font-medium tracking-wider uppercase">
                  3 / 3
                </span>
              </div>
              <h2 className="text-[20px] font-semibold text-white">{t.onboarding.hotkeyTitle}</h2>
              <p className="text-[13px] text-[#6B6B7A] mt-1">
                {t.onboarding.hotkeyDesc}
              </p>
            </div>
            
            {/* Content */}
            <div className="flex-1 px-10 py-6">
              {/* Keyboard shortcut display */}
              <div className="flex items-center justify-center gap-3 py-8">
                <kbd className="h-12 px-4 min-w-[48px] flex items-center justify-center bg-[#1A1A24] rounded-lg text-white text-[18px] font-semibold font-mono border border-white/[0.08] shadow-[0_2px_0_0_rgba(0,0,0,0.3)]">
                  ⌥
                </kbd>
                <span className="text-[#4B4B5A] text-lg">+</span>
                <kbd className="h-12 px-5 min-w-[80px] flex items-center justify-center bg-[#1A1A24] rounded-lg text-white text-[16px] font-semibold font-mono border border-white/[0.08] shadow-[0_2px_0_0_rgba(0,0,0,0.3)]">
                  Space
                </kbd>
              </div>
              
              {/* Permission notice */}
              <div className="p-4 rounded-lg bg-[#0F0F14] border border-white/[0.04]">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-[#3B82F6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[13px] text-[#8B8B9E] font-medium mb-1">{t.onboarding.hotkeyPermission}</p>
                    <p className="text-[12px] text-[#6B6B7A] leading-relaxed">
                      {t.onboarding.hotkeyPermissionDesc}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-10 pb-8 flex items-center justify-between">
              <button
                onClick={goPrev}
                className="h-9 px-4 text-[13px] text-[#8B8B9E] hover:text-white transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                {t.onboarding.back}
              </button>
              <button
                onClick={goNext}
                className="h-9 px-5 bg-white text-[#0A0A0F] rounded-lg font-medium text-[13px] hover:bg-white/90 transition-colors flex items-center gap-1.5"
              >
                {t.onboarding.done}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        );

      case "done":
        return (
          <div className="flex flex-col h-full">
            {/* Main content */}
            <div className="flex-1 flex flex-col justify-center items-center px-10 py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#4ADE80]/10 flex items-center justify-center mb-6">
                <Check className="w-8 h-8 text-[#4ADE80]" />
              </div>
              
              <h1 className="text-[24px] font-semibold text-white tracking-tight mb-3">
                {t.onboarding.doneTitle}
              </h1>
              
              <p className="text-[14px] text-[#6B6B7A] leading-relaxed max-w-[280px]">
                {t.onboarding.doneDesc}
              </p>
            </div>
            
            {/* Footer */}
            <div className="px-10 pb-8">
              <button
                onClick={handleComplete}
                className="w-full h-11 bg-[#4ADE80] text-[#0A0A0F] rounded-lg font-medium text-[14px] hover:bg-[#4ADE80]/90 transition-colors flex items-center justify-center gap-2"
              >
                {t.onboarding.startUsing}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title=""
      size="md"
      showCloseButton={false}
      className="!bg-[#0A0A0F] !border-[#1A1A24] overflow-hidden"
      contentClassName="p-0"
    >
      <div className="h-[480px] flex flex-col">
        {renderStepContent()}
      </div>
    </Modal>
  );
}
