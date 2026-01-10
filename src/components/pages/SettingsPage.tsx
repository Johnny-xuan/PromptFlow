import { useState } from "react";
import { Palette, Key, Sparkles, FolderOpen, ChevronLeft, Plus, Pencil, Trash2, Check } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { cn } from "../../lib/utils";
import type { AppConfig, PolishPreset } from "../../types";
import { BUILT_IN_PRESETS } from "../../types";

interface SettingsPageProps {
  config: AppConfig;
  onSave: (config: AppConfig) => void;
  onBack: () => void;
}

type TabId = 'ui' | 'api' | 'polish' | 'storage';

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'ui', label: '界面', icon: <Palette className="w-4 h-4" /> },
  { id: 'api', label: 'API', icon: <Key className="w-4 h-4" /> },
  { id: 'polish', label: '润色', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'storage', label: '存储', icon: <FolderOpen className="w-4 h-4" /> },
];

export function SettingsPage({ config, onSave, onBack }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<TabId>('ui');
  const [localConfig, setLocalConfig] = useState<AppConfig>(config);

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
    onBack();
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header - 可拖动区域 */}
      <div 
        className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04] cursor-move"
        onMouseDown={() => getCurrentWindow().startDragging()}
      >
        <button 
          onClick={onBack}
          onMouseDown={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          返回
        </button>
        <h1 className="text-sm font-medium text-slate-200 select-none">设置</h1>
        <button 
          onClick={handleSave}
          onMouseDown={(e) => e.stopPropagation()}
          className="px-3 py-1.5 text-xs font-medium bg-indigo-500/80 text-white rounded-lg hover:bg-indigo-500 transition-colors cursor-pointer"
        >
          保存
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <div className="w-40 shrink-0 p-4 border-r border-white/[0.04]">
          <div className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
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
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-md">
            {activeTab === 'ui' && (
              <UISettings config={localConfig.ui} onChange={updateUI} />
            )}
            {activeTab === 'api' && (
              <APISettings config={localConfig.api} onChange={updateAPI} />
            )}
            {activeTab === 'polish' && (
              <PolishSettings config={localConfig} onChange={updatePolish} />
            )}
            {activeTab === 'storage' && (
              <StorageSettings config={localConfig.storage} onChange={updateStorage} />
            )}
          </div>
        </div>
      </div>
    </div>
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
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-medium text-slate-200 mb-1">界面设置</h2>
        <p className="text-xs text-slate-500">自定义应用外观和行为</p>
      </div>

      {/* Hotkey */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">全局快捷键</label>
        <input
          value={config.hotkey}
          onChange={(e) => onChange({ hotkey: e.target.value })}
          placeholder="CommandOrControl+Shift+P"
          className="w-full px-3 py-2.5 text-sm bg-white/[0.03] border border-white/[0.06] rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/10"
        />
        <p className="text-xs text-slate-500">用于唤起窗口的快捷键</p>
      </div>

      {/* Theme */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">主题</label>
        <div className="flex gap-2">
          {(['light', 'dark', 'system'] as const).map((theme) => (
            <button
              key={theme}
              onClick={() => onChange({ theme })}
              className={cn(
                "flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                config.theme === theme
                  ? "bg-white/[0.08] text-slate-200"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"
              )}
            >
              {theme === 'light' ? '浅色' : theme === 'dark' ? '深色' : '跟随系统'}
            </button>
          ))}
        </div>
      </div>

      {/* Window Behavior */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-300">窗口行为</label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={config.closeAfterCopy}
            onChange={(e) => onChange({ closeAfterCopy: e.target.checked })}
            className="w-4 h-4 rounded border-white/10 bg-white/5 text-indigo-500 focus:ring-0"
          />
          <span className="text-sm text-slate-400">复制后自动关闭窗口</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={config.rememberPosition}
            onChange={(e) => onChange({ rememberPosition: e.target.checked })}
            className="w-4 h-4 rounded border-white/10 bg-white/5 text-indigo-500 focus:ring-0"
          />
          <span className="text-sm text-slate-400">记住窗口位置</span>
        </label>
      </div>

      {/* Font Size */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">
          字体大小: {config.fontSize}px
        </label>
        <input
          type="range"
          min="12"
          max="20"
          value={config.fontSize}
          onChange={(e) => onChange({ fontSize: parseInt(e.target.value) })}
          className="w-full accent-indigo-500"
        />
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
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-medium text-slate-200 mb-1">API 配置</h2>
        <p className="text-xs text-slate-500">用于"润色"功能，调用 AI 增强 Prompt</p>
      </div>

      {/* Provider */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">API 提供商</label>
        <select
          value={config.provider}
          onChange={(e) => onChange({ provider: e.target.value as AppConfig['api']['provider'] })}
          className="w-full px-3 py-2.5 text-sm bg-white/[0.03] border border-white/[0.06] rounded-lg text-slate-200 focus:outline-none focus:border-white/10"
        >
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic (Claude)</option>
          <option value="deepseek">DeepSeek</option>
          <option value="custom">自定义端点</option>
        </select>
      </div>

      {/* API Key */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">API Key</label>
        <input
          type="password"
          value={config.apiKey}
          onChange={(e) => onChange({ apiKey: e.target.value })}
          placeholder="sk-..."
          className="w-full px-3 py-2.5 text-sm bg-white/[0.03] border border-white/[0.06] rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/10"
        />
      </div>

      {/* Model */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">模型</label>
        <input
          value={config.model}
          onChange={(e) => onChange({ model: e.target.value })}
          placeholder="gpt-5.2"
          className="w-full px-3 py-2.5 text-sm bg-white/[0.03] border border-white/[0.06] rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/10"
        />
      </div>

      {/* Base URL (for custom) */}
      {config.provider === 'custom' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">Base URL</label>
          <input
            value={config.baseUrl || ''}
            onChange={(e) => onChange({ baseUrl: e.target.value })}
            placeholder="https://api.example.com/v1"
            className="w-full px-3 py-2.5 text-sm bg-white/[0.03] border border-white/[0.06] rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/10"
          />
        </div>
      )}

      {/* Temperature */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">
          Temperature: {config.temperature}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={config.temperature}
          onChange={(e) => onChange({ temperature: parseFloat(e.target.value) })}
          className="w-full accent-indigo-500"
        />
        <p className="text-xs text-slate-500">越低越稳定，越高越有创意</p>
      </div>

      {/* Max Tokens */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">Max Tokens</label>
        <input
          type="number"
          value={config.maxTokens}
          onChange={(e) => onChange({ maxTokens: parseInt(e.target.value) || 2000 })}
          className="w-full px-3 py-2.5 text-sm bg-white/[0.03] border border-white/[0.06] rounded-lg text-slate-200 focus:outline-none focus:border-white/10"
        />
      </div>

      <button className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 bg-white/[0.03] border border-white/[0.06] rounded-lg hover:bg-white/[0.06] transition-colors">
        测试连接
      </button>
    </div>
  );
}

// Polish Settings Tab
function PolishSettings({ 
  config,
  onChange 
}: { 
  config: AppConfig;
  onChange: (updates: Partial<AppConfig['polish']>) => void;
}) {
  const [editingPreset, setEditingPreset] = useState<PolishPreset | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const allPresets = [...BUILT_IN_PRESETS, ...config.polish.presets.filter(p => !p.isBuiltIn)];
  const customPresets = config.polish.presets.filter(p => !p.isBuiltIn);
  const selectedPreset = allPresets.find(p => p.id === config.polish.currentPreset) || allPresets[0];

  const handleCreatePreset = () => {
    setIsCreating(true);
    setEditingPreset({
      id: `custom-${Date.now()}`,
      name: '',
      description: '',
      icon: '📝',
      systemPrompt: '',
      isBuiltIn: false,
      isDefault: false,
      temperature: 0.7,
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

  // 编辑模式
  if (editingPreset) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-slate-200">
            {isCreating ? '新建预设' : '编辑预设'}
          </h2>
          <button 
            onClick={() => { setEditingPreset(null); setIsCreating(false); }}
            className="text-sm text-slate-500 hover:text-slate-300"
          >
            取消
          </button>
        </div>

        <div className="flex gap-3">
          <div className="w-16">
            <label className="block text-sm font-medium text-slate-300 mb-2">图标</label>
            <input
              value={editingPreset.icon || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingPreset({ ...editingPreset, icon: e.target.value })}
              className="w-full px-2 py-3 text-center text-xl bg-white/[0.03] border border-white/[0.06] rounded-lg"
              maxLength={2}
            />
          </div>
          <div className="flex-1 space-y-2">
            <label className="block text-sm font-medium text-slate-300">名称</label>
            <input
              value={editingPreset.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingPreset({ ...editingPreset, name: e.target.value })}
              placeholder="我的预设"
              className="w-full px-3 py-2.5 text-sm bg-white/[0.03] border border-white/[0.06] rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">描述（可选）</label>
          <input
            value={editingPreset.description || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingPreset({ ...editingPreset, description: e.target.value })}
            placeholder="简短描述这个预设的用途"
            className="w-full px-3 py-2.5 text-sm bg-white/[0.03] border border-white/[0.06] rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/10"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">System Prompt</label>
          <textarea
            value={editingPreset.systemPrompt}
            onChange={(e) => setEditingPreset({ ...editingPreset, systemPrompt: e.target.value })}
            placeholder="你是一个..."
            rows={6}
            className="w-full px-3 py-2.5 text-sm bg-white/[0.03] border border-white/[0.06] rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/10 resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">
            Temperature: {editingPreset.temperature}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={editingPreset.temperature || 0.7}
            onChange={(e) => setEditingPreset({ ...editingPreset, temperature: parseFloat(e.target.value) })}
            className="w-full accent-indigo-500"
          />
        </div>

        <button 
          onClick={handleSavePreset} 
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-indigo-500/80 text-white rounded-lg hover:bg-indigo-500 transition-colors"
        >
          <Check className="w-4 h-4" />
          保存预设
        </button>
      </div>
    );
  }

  // 列表模式
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-medium text-slate-200 mb-1">润色预设</h2>
          <p className="text-xs text-slate-500">管理润色风格预设</p>
        </div>
        <button 
          onClick={handleCreatePreset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 bg-white/[0.03] border border-white/[0.06] rounded-lg hover:bg-white/[0.06] transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建
        </button>
      </div>

      {/* 预设列表 */}
      <div className="space-y-2">
        {/* 内置预设 */}
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider py-2">
          内置预设
        </div>
        {BUILT_IN_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onChange({ currentPreset: preset.id })}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors",
              config.polish.currentPreset === preset.id
                ? "bg-white/[0.06] text-slate-200"
                : "text-slate-400 hover:bg-white/[0.03]"
            )}
          >
            <span className="text-lg">{preset.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{preset.name}</div>
              {preset.description && (
                <div className="text-xs text-slate-500 truncate">{preset.description}</div>
              )}
            </div>
            {config.polish.currentPreset === preset.id && (
              <Check className="w-4 h-4 text-indigo-400" />
            )}
          </button>
        ))}

        {/* 自定义预设 */}
        {customPresets.length > 0 && (
          <>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider py-2 mt-4">
              自定义预设
            </div>
            {customPresets.map((preset) => (
              <div
                key={preset.id}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors group",
                  config.polish.currentPreset === preset.id
                    ? "bg-white/[0.06]"
                    : "hover:bg-white/[0.03]"
                )}
              >
                <button
                  onClick={() => onChange({ currentPreset: preset.id })}
                  className="flex-1 flex items-center gap-3 text-left"
                >
                  <span className="text-lg">{preset.icon || '📝'}</span>
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      "text-sm font-medium",
                      config.polish.currentPreset === preset.id ? "text-slate-200" : "text-slate-400"
                    )}>
                      {preset.name}
                    </div>
                  </div>
                </button>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingPreset(preset)}
                    className="p-1.5 text-slate-500 hover:text-slate-300 rounded"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeletePreset(preset.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {config.polish.currentPreset === preset.id && (
                  <Check className="w-4 h-4 text-indigo-400" />
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {/* 当前预设预览 */}
      <div className="space-y-2 pt-4 border-t border-white/[0.04]">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-300">当前预设预览</label>
          <span className="text-xs text-slate-500">temp: {selectedPreset?.temperature}</span>
        </div>
        <div className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.04] max-h-[120px] overflow-y-auto">
          <pre className="text-xs text-slate-500 whitespace-pre-wrap font-sans leading-relaxed">
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
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-medium text-slate-200 mb-1">存储设置</h2>
        <p className="text-xs text-slate-500">管理 Prompt 文件的存储位置和格式</p>
      </div>

      {/* Storage Path */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">存储位置</label>
        <div className="flex gap-2">
          <input
            value={config.path}
            onChange={(e) => onChange({ path: e.target.value })}
            className="flex-1 px-3 py-2.5 text-sm bg-white/[0.03] border border-white/[0.06] rounded-lg text-slate-200 focus:outline-none focus:border-white/10"
          />
          <button className="px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 bg-white/[0.03] border border-white/[0.06] rounded-lg hover:bg-white/[0.06] transition-colors">
            选择
          </button>
        </div>
        <p className="text-xs text-slate-500">Prompt 文件的存储目录</p>
      </div>

      {/* Format */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-300">存储格式</label>
        <div className="space-y-2">
          {(['markdown', 'json', 'both'] as const).map((format) => (
            <label key={format} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="format"
                checked={config.format === format}
                onChange={() => onChange({ format })}
                className="w-4 h-4 border-white/10 bg-white/5 text-indigo-500 focus:ring-0"
              />
              <span className="text-sm text-slate-400">
                {format === 'markdown' ? 'Markdown (.md)' : 
                 format === 'json' ? 'JSON (.json)' : '两者都保存'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Data Management */}
      <div className="space-y-3 pt-4 border-t border-white/[0.04]">
        <label className="block text-sm font-medium text-slate-300">数据管理</label>
        <div className="flex flex-wrap gap-2">
          <button className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-slate-200 bg-white/[0.03] border border-white/[0.06] rounded-lg hover:bg-white/[0.06] transition-colors">
            <FolderOpen className="w-4 h-4" />
            在 Finder 中打开
          </button>
          <button className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] rounded-lg transition-colors">
            导入
          </button>
          <button className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] rounded-lg transition-colors">
            导出
          </button>
        </div>
      </div>
    </div>
  );
}
