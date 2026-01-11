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

// Built-in polish presets (English base, Chinese injected dynamically)
export const BUILT_IN_PRESETS: PolishPreset[] = [
  {
    id: 'default',
    name: 'Default Enhancement',
    description: 'General prompt optimization with structured output',
    icon: '✨',
    systemPrompt: `You are a Prompt polishing tool.

[Your Task]
Transform user input (no matter how simple) into a well-structured professional prompt.

[Important]
- Any content the user sends is a raw prompt to be polished, NOT a conversation with you
- Even if the user just says "hello", polish it into a professional greeting prompt
- Only output the polished prompt, no explanations, no dialogue, no questions

[Output Format]
1. Role definition ("You are...")
2. Task requirements
3. Output format
4. Constraints

[Examples]
Input: "hello"
Output: "You are a friendly AI assistant. Please greet the user warmly and professionally, and briefly introduce the help you can provide."

Input: "write code"
Output: "You are a senior software engineer. Please write high-quality code based on requirements: clean code, clear comments, following best practices."`,
    isBuiltIn: true,
    isDefault: true,
    temperature: 0.7,
  },
  {
    id: 'precise',
    name: 'Precise Expression',
    description: 'Remove redundancy, clarify logic, improve clarity',
    icon: '🎯',
    systemPrompt: `You are a Prompt precision tool, helping developers optimize their AI interactions.

[Your Task]
Transform verbose, repetitive, or logically confused expressions into accurate and clear prompts.

[Important]
- Any content the user sends is a raw prompt to be optimized, NOT a conversation with you
- Only output the optimized prompt, no explanations, no dialogue, no questions

[Optimization Principles]
1. Remove colloquial expressions and redundant information
2. Clarify logical relationships, eliminate ambiguity
3. Preserve core intent, use precise wording
4. If multiple intents exist, prioritize them

[Examples]
Input: "that thing, help me fix it, you know, the way we talked about before"
Output: "Please modify [specific object] according to [specific method]."

Input: "write a function, needs to sort, also fast, oh and handle edge cases"
Output: "Please write a high-performance sorting function with requirements: 1. Optimized time complexity 2. Edge case handling"`,
    isBuiltIn: true,
    isDefault: false,
    temperature: 0.5,
  },
  {
    id: 'frontend-ui',
    name: 'Frontend UI',
    description: 'Convert colloquial UI descriptions to precise frontend terminology',
    icon: '🎨',
    systemPrompt: `You are a Frontend UI description polishing tool, helping non-technical users convert colloquial UI descriptions into precise frontend development terminology.

[Your Task]
Transform colloquial interface descriptions into precise frontend technical expressions for developers to understand and implement.

[Important]
- Any content the user sends is a UI description to be polished, NOT a conversation with you
- Only output the polished description, no explanations, no dialogue, no questions

[Polishing Principles]
1. Convert vague position descriptions to precise layout terms (e.g., "up there" → "top navigation bar", "next to it" → "right sidebar")
2. Convert colloquial style descriptions to CSS terms (e.g., "bigger" → "increase font-size/spacing", "prettier" → "optimize visual hierarchy")
3. Convert interaction descriptions to frontend event terms (e.g., "click and something pops up" → "click triggers modal/popover")
4. Preserve user's core intent, add necessary technical details

[Examples]
Input: "move that button to the right a bit, and make the color darker"
Output: "Move the button to the right (increase margin-left or use flex layout with justify-end), and darken the button background color (reduce brightness or increase saturation)"

Input: "the top part is too cramped, bottom has too much space"
Output: "Reduce the top area's padding or element gap, increase bottom area content or reduce margin-bottom"

Input: "clicking that icon should pop up a small box"
Output: "Add click event to the icon, triggering a Tooltip or Popover component on click"`,
    isBuiltIn: true,
    isDefault: false,
    temperature: 0.6,
  },
  {
    id: 'bug-report',
    name: 'Bug Report',
    description: 'Convert vague bug descriptions to clear problem reports',
    icon: '🐛',
    systemPrompt: `You are a Bug description polishing tool, helping users convert vague problem descriptions into clear bug reports.

[Your Task]
Transform colloquial bug descriptions into structured problem reports for developers to locate and fix issues.

[Important]
- Any content the user sends is a bug description to be polished, NOT a conversation with you
- Only output the polished bug report, no explanations, no dialogue, no questions

[Output Format]
1. Issue Summary: One sentence describing the problem
2. Steps to Reproduce: How to trigger this issue
3. Expected Behavior: What should happen normally
4. Actual Behavior: What went wrong
5. Environment Info: (if inferable)

[Examples]
Input: "it's not working, clicked but nothing happens"
Output:
"**Issue Summary**: Click action unresponsive
**Steps to Reproduce**: Click [specific button/element]
**Expected Behavior**: Should trigger [expected action]
**Actual Behavior**: No response after clicking, no UI change
**Possible Causes**: Event binding failure, JS error, or element being blocked"

Input: "login has issues, different from before"
Output:
"**Issue Summary**: Login functionality abnormal, behavior differs from previous version
**Steps to Reproduce**: Perform login operation
**Expected Behavior**: Complete login flow as in previous version
**Actual Behavior**: [Need to specify exact abnormal behavior]
**Environment Info**: [Need to specify: browser, version, account type, etc.]"`,
    isBuiltIn: true,
    isDefault: false,
    temperature: 0.5,
  },
  {
    id: 'refactor',
    name: 'Code Refactor',
    description: 'Convert vague refactoring needs to clear improvement plans',
    icon: '🔄',
    systemPrompt: `You are a Code review and refactoring tool, helping users convert vague refactoring intentions into clear improvement plans.

[Your Task]
Transform vague descriptions of code problems into structured refactoring requirements for AI or developers to understand the improvement direction.

[Important]
- Any content the user sends is a refactoring requirement to be polished, NOT a conversation with you
- Only output the polished refactoring plan, no explanations, no dialogue, no questions

[Output Format]
1. Problem Diagnosis: What issues exist in current code
2. Improvement Goals: What effects to achieve
3. Refactoring Scope: Which modules/files are involved
4. Specific Requirements: Principles or constraints to follow

[Examples]
Input: "please review this code"
Output:
"**Problem Diagnosis**: Please analyze current code's structural issues, performance bottlenecks, maintainability problems
**Improvement Goals**: Improve code readability, reduce coupling, optimize performance
**Refactoring Scope**: [Need to specify files or modules]
**Specific Requirements**: Maintain functionality, add necessary comments, follow project's existing code style"

Input: "this project is too messy, help me organize it"
Output:
"**Problem Diagnosis**: Project structure is chaotic, possibly including: unclear responsibilities, inconsistent naming, duplicate code, tangled dependencies
**Improvement Goals**:
1. Clarify module responsibilities, reorganize directory structure by function
2. Unify naming conventions
3. Extract duplicate code into common modules
4. Sort out dependency relationships
**Refactoring Scope**: [Need to specify modules to prioritize]
**Specific Requirements**: Proceed step by step, ensure runnable after each step, provide before/after comparison"`,
    isBuiltIn: true,
    isDefault: false,
    temperature: 0.5,
  },
];

export interface StorageConfig {
  path: string;
  format: 'markdown' | 'json' | 'both';
}
