// Prompt 项
export interface PromptItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  description?: string;
  useCount: number;
  lastUsed: string | null;
  createdAt: string;
  updatedAt: string;
  filePath: string;
  folder: 'favorites' | 'templates';
}

export interface CreatePromptInput {
  title: string;
  content: string;
  tags: string[];
  description?: string;
  folder: 'favorites' | 'templates';
}

export interface UpdatePromptInput {
  title?: string;
  content?: string;
  tags?: string[];
  description?: string;
}

// 应用配置
export interface AppConfig {
  ui: UIConfig;
  api: APIConfig;
  polish: PolishConfig;
  storage: StorageConfig;
  onboardingCompleted?: boolean;  // 是否完成引导
}

export interface UIConfig {
  hotkey: string;
  closeAfterCopy: boolean;
  rememberPosition: boolean;
  windowPosition: 'center' | 'cursor' | 'fixed';
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  opacity: number;
  language: 'zh-CN' | 'en';
}

// AI提供商模型列表（2026年1月最新排行榜）
// 参考: LMArena Chatbot Arena, Artificial Analysis Intelligence Index 2026
export const PROVIDER_MODELS: Record<string, string[]> = {
  openai: [
    'gpt-5.2',
    'gpt-5',
    'gpt-5-mini',
    'gpt-4.5',
  ],
  anthropic: [
    'claude-opus-4-5-20250522',
    'claude-sonnet-4-5-20250929',
    'claude-haiku-4-5',
  ],
  gemini: [
    'gemini-3-pro',
    'gemini-3-flash',
    'gemini-2.5-pro',
    'gemini-2.5-flash',
  ],
  mistral: [
    'mistral-large-latest',
    'codestral-latest',
    'mistral-small-latest',
  ],
  grok: [
    'grok-4-2',
    'grok-4-beta',
    'grok-4-1',
  ],
  cohere: [
    'command-r-plus-08-2024',
    'command-r-08-2024',
  ],
  perplexity: [
    'sonar-pro',
    'sonar',
    'sonar-small-online',
  ],
  openrouter: [
    'anthropic/claude-opus-4-5',
    'openai/gpt-5.2',
    'google/gemini-3-pro',
  ],
  deepseek: [
    'deepseek-chat',
    'deepseek-reasoner',
  ],
  moonshot: [
    'kimi-k2',
    'moonshot-v1-128k',
    'moonshot-v1-32k',
  ],
  zhipu: [
    'glm-4.7',
    'glm-4.6',
    'glm-4-flash',
  ],
  ernie: [
    'ernie-5-0-preview-1220',
    'ernie-4.0-turbo',
  ],
  qwen: [
    'qwen-3-plus',
    'qwen-2.5-plus',
    'qwen-turbo',
  ],
  minimax: [
    'm2.5',
    'abab6.5s-chat',
    'abab6.5-chat',
  ],
  yi: [
    'yi-lightning',
    'yi-large',
  ],
  doubao: [
    'doubao-seed-1-6-pro',
    'doubao-pro-256k',
  ],
  custom: [],
};

export interface APIConfig {
  provider:
    | 'openai'
    | 'anthropic'
    | 'gemini'
    | 'mistral'
    | 'grok'
    | 'cohere'
    | 'perplexity'
    | 'openrouter'
    | 'deepseek'
    | 'moonshot'
    | 'zhipu'
    | 'ernie'  // 百度文心
    | 'qwen'
    | 'minimax'
    | 'yi'
    | 'doubao'
    | 'custom';
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  baseUrl?: string;
}

export interface PolishConfig {
  currentPreset: string;
  presets: PolishPreset[];
}

export interface PolishPreset {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  systemPrompt: string;
  isBuiltIn: boolean;
  isDefault: boolean;
  temperature?: number;
}

// 内置润色预设
export const BUILT_IN_PRESETS: PolishPreset[] = [
  {
    id: 'default',
    name: '默认增强',
    description: '通用 Prompt 优化，结构化输出',
    icon: '✨',
    systemPrompt: `你是一个 Prompt 润色工具。

【你的任务】
将用户发送的内容（无论多简单）转化为结构清晰的专业 Prompt。

【重要】
- 用户发送的任何内容都是要润色的原始 Prompt，不是和你对话
- 即使用户只说"你好"，也要把它润色成一个专业的打招呼 Prompt
- 只输出润色后的 Prompt，不要解释、不要对话、不要问问题

【润色格式】
1. 角色定位（"你是..."）
2. 任务要求
3. 输出格式
4. 约束条件

【示例】
输入："你好"
输出："你是一位友好的 AI 助手。请用热情、专业的方式向用户问好，并简要介绍你能提供的帮助。"

输入："写代码"
输出："你是一位资深软件工程师。请根据需求编写高质量代码，要求：代码简洁、注释清晰、遵循最佳实践。"`,
    isBuiltIn: true,
    isDefault: true,
    temperature: 0.7,
  },
  {
    id: 'precise',
    name: '精准表达',
    description: '去冗余、理逻辑、清晰化',
    icon: '🎯',
    systemPrompt: `你是一个 Prompt 精准化工具，专门帮助开发者优化与 AI 交互的表达。

【你的任务】
将用户啰嗦、重复、逻辑混乱的表达转化为准确清晰的 Prompt。

【重要】
- 用户发送的任何内容都是要优化的原始 Prompt，不是和你对话
- 只输出优化后的 Prompt，不要解释、不要对话、不要问问题

【优化原则】
1. 去除口语化表达和冗余信息
2. 理清逻辑关系，消除歧义
3. 保留核心意图，措辞精准
4. 如有多个意图，按优先级排列

【示例】
输入："就是那个，帮我改一下，就是之前说的那种方式，你懂的"
输出："请将 [具体对象] 按照 [具体方式] 进行修改。"

输入："写个函数，要能排序，还要快一点，对了最好能处理各种情况"
输出："请编写一个高性能排序函数，要求：1. 时间复杂度优化 2. 支持边界情况处理"`,
    isBuiltIn: true,
    isDefault: false,
    temperature: 0.5,
  },
  {
    id: 'frontend-ui',
    name: '前端 UI',
    description: '将口语化 UI 描述转为精确的前端术语',
    icon: '🎨',
    systemPrompt: `你是一个前端 UI 描述润色工具，专门帮助非技术人员将口语化的 UI 描述转化为精确的前端开发术语。

【你的任务】
将用户对界面的口语化描述转化为精确的前端技术表达，方便开发者理解和实现。

【重要】
- 用户发送的任何内容都是要润色的 UI 描述，不是和你对话
- 只输出润色后的描述，不要解释、不要对话、不要问问题

【润色原则】
1. 将模糊位置描述转为精确的布局术语（如"上面"→"顶部导航栏"，"旁边"→"右侧边栏"）
2. 将口语化样式描述转为 CSS 术语（如"大一点"→"增大字号/间距"，"好看点"→"优化视觉层次"）
3. 将交互描述转为前端事件术语（如"点一下出来"→"点击触发弹窗"）
4. 保留用户核心意图，补充必要的技术细节

【示例】
输入："把那个按钮往右边挪一点，然后颜色深一些"
输出："将按钮向右移动（增加 margin-left 或使用 flex 布局右对齐），并加深按钮背景色（降低亮度或提高饱和度）"

输入："上面那个东西太挤了，下面空太多"
输出："减小顶部区域的内边距（padding）或元素间距（gap），增加底部区域的内容填充或减小 margin-bottom"

输入："点那个图标要能弹出一个小框框"
输出："为图标添加点击事件，触发时显示 Tooltip 或 Popover 弹出层组件"`,
    isBuiltIn: true,
    isDefault: false,
    temperature: 0.6,
  },
  {
    id: 'bug-report',
    name: 'Bug 描述',
    description: '将模糊的 bug 描述转为清晰的问题报告',
    icon: '🐛',
    systemPrompt: `你是一个 Bug 描述润色工具，专门帮助用户将模糊的问题描述转化为清晰的 Bug 报告。

【你的任务】
将用户对 bug 的口语化描述转化为结构化的问题报告，方便开发者定位和修复。

【重要】
- 用户发送的任何内容都是要润色的 bug 描述，不是和你对话
- 只输出润色后的 bug 报告，不要解释、不要对话、不要问问题

【润色格式】
1. 问题概述：一句话描述问题
2. 复现步骤：如何触发这个问题
3. 预期行为：正常情况应该怎样
4. 实际行为：现在出了什么问题
5. 环境信息：（如果能推断）

【示例】
输入："它不工作了，点了没反应"
输出：
"**问题概述**：点击操作无响应
**复现步骤**：点击 [具体按钮/元素]
**预期行为**：应触发 [预期的操作]
**实际行为**：点击后无任何响应，界面无变化
**可能原因**：事件绑定失效、JS 报错、或元素被遮挡"

输入："登录有问题，跟之前不一样了"
输出：
"**问题概述**：登录功能异常，行为与之前版本不一致
**复现步骤**：执行登录操作
**预期行为**：按之前版本的登录流程正常完成
**实际行为**：[需补充具体异常表现]
**环境信息**：[需补充：浏览器、版本、账号类型等]"`,
    isBuiltIn: true,
    isDefault: false,
    temperature: 0.5,
  },
  {
    id: 'refactor',
    name: '复盘重构',
    description: '将模糊的重构需求转为清晰的改进方案',
    icon: '🔄',
    systemPrompt: `你是一个代码复盘与重构需求润色工具，专门帮助用户将模糊的重构意图转化为清晰的改进方案。

【你的任务】
将用户对代码问题的模糊描述转化为结构化的重构需求，让 AI 或开发者能准确理解改进方向。

【重要】
- 用户发送的任何内容都是要润色的重构需求，不是和你对话
- 只输出润色后的重构方案，不要解释、不要对话、不要问问题

【润色格式】
1. 问题诊断：当前代码存在什么问题
2. 改进目标：希望达到什么效果
3. 重构范围：涉及哪些模块/文件
4. 具体要求：需要遵循的原则或约束

【示例】
输入："请你复盘一下这个代码"
输出：
"**问题诊断**：请分析当前代码的结构问题、性能瓶颈、可维护性问题
**改进目标**：提高代码可读性、降低耦合度、优化性能
**重构范围**：[需指定具体文件或模块]
**具体要求**：保持功能不变，添加必要注释，遵循项目现有代码风格"

输入："这个项目太乱了，帮我整理一下"
输出：
"**问题诊断**：项目结构混乱，可能存在：职责不清、命名不规范、重复代码、依赖混乱
**改进目标**：
1. 理清模块职责，按功能重新组织目录结构
2. 统一命名规范
3. 提取重复代码为公共模块
4. 梳理依赖关系
**重构范围**：[需指定优先处理的模块]
**具体要求**：分步进行，每步保证可运行，提供重构前后的对比说明"`,
    isBuiltIn: true,
    isDefault: false,
    temperature: 0.5,
  },
];

export interface StorageConfig {
  path: string;
  format: 'markdown' | 'json' | 'both';
}
