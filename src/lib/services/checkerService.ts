// Checker Service - AI 自主判断是否需要澄清用户意图

import type { APIConfig, PolishPreset } from '../../types';
import type { ClarificationQuestion, UserSelection } from '../../types/intent';
import { llmClient } from './llmClient';
import { parseStructuredOutput, validateCheckerAnalyzeOutput } from './structuredOutput';

// AI 一次性分析 - 基于问题类型检测
const CHECKER_ANALYZE_PROMPT = `你是一个 Prompt 质量分析专家，专门帮助开发者优化与 AI 交互的表达。

## 你的任务
分析用户输入，检测常见问题，生成针对性的澄清问题。

## 问题类型
1. **指代不明** - "那个"、"之前的"等模糊指代
2. **多意图混合** - 一句话多个任务，优先级不明
3. **隐含假设** - 省略关键上下文（语言、框架、场景）
4. **逻辑不清** - 矛盾、否定套否定、因果混乱
5. **口语化模糊** - "差不多"、"那种感觉"、"你懂的"

## 判断原则
- 检测到问题且会影响润色结果 → 提问（1-3个问题）
- 表达清晰或可自动修正 → 不提问

## 输出格式
{"isClear": true/false, "problems": ["问题类型"], "questions": [...]}

## 示例

输入："把那个改成之前说的方式"
输出：{"isClear": false, "problems": ["指代不明"], "questions": [{"id": "q1", "question": "你说的"那个"是指什么？", "type": "single", "options": [{"id": "code", "label": "某段代码", "icon": "💻"}, {"id": "config", "label": "配置文件", "icon": "⚙️"}, {"id": "other", "label": "其它", "icon": "✏️", "allowCustomInput": true}]}]}

输入："写个排序函数"
输出：{"isClear": false, "problems": ["隐含假设"], "questions": [{"id": "q1", "question": "用什么编程语言？", "type": "single", "options": [{"id": "py", "label": "Python", "icon": "🐍"}, {"id": "js", "label": "JavaScript", "icon": "📜"}, {"id": "other", "label": "其它", "icon": "✏️", "allowCustomInput": true}]}]}

输入："帮我优化这段代码"
输出：{"isClear": false, "problems": ["隐含假设"], "questions": [{"id": "q1", "question": "从哪些方面优化？", "type": "multiple", "options": [{"id": "perf", "label": "性能", "icon": "⚡"}, {"id": "read", "label": "可读性", "icon": "📖"}, {"id": "safe", "label": "安全性", "icon": "🔒"}, {"id": "other", "label": "其它", "icon": "✏️", "allowCustomInput": true}]}]}

输入："就是那种高级的感觉，你懂的"
输出：{"isClear": false, "problems": ["口语化模糊"], "questions": [{"id": "q1", "question": "你说的"高级感"具体指？", "type": "single", "options": [{"id": "minimal", "label": "简洁极简", "icon": "✨"}, {"id": "pro", "label": "专业严谨", "icon": "📊"}, {"id": "other", "label": "其它", "icon": "✏️", "allowCustomInput": true}]}]}

输入："用 Python 写一个快速排序，输入整数列表，返回升序结果"
输出：{"isClear": true, "problems": [], "questions": []}

只输出 JSON。`;

// 第二阶段：根据用户回答补全 prompt
const CHECKER_COMPLETE_PROMPT = `你是一个提示词补全专家。用户提供了原始输入和一些补充信息。

你的任务是将这些信息整合，输出一个更完整、更清晰的提示词草稿。

注意：
- 保持用户原始意图，不要过度发挥
- 自然地融入补充信息，不要生硬罗列
- 输出应该是一个可以直接用于润色的提示词草稿

直接输出补全后的提示词，不要添加任何解释或前缀。`;

// 问答历史记录
export interface QAHistory {
  question: ClarificationQuestion;
  answer: UserSelection;
}

export interface CheckerInput {
  rawInput: string;
  preset: PolishPreset;
  userSelections?: UserSelection[]; // 用户在卡片上的选择
  qaHistory?: QAHistory[]; // 已有的问答历史
}

export interface CheckerResult {
  // 分析结果
  needsClarification: boolean;
  questions?: ClarificationQuestion[]; // 所有需要澄清的问题（1-3个）
  reason?: string;
  
  // 最终结果
  clarifiedPrompt: string;
  success: boolean;
  error?: string;
}

// AI 一次性分析意图，返回所有需要澄清的问题
export async function analyzeIntent(
  input: CheckerInput,
  apiConfig: APIConfig
): Promise<CheckerResult> {
  const { rawInput, preset } = input;

  if (!rawInput.trim()) {
    return { needsClarification: false, clarifiedPrompt: '', success: false, error: '输入为空' };
  }

  if (!apiConfig.apiKey) {
    return { needsClarification: false, clarifiedPrompt: rawInput, success: true };
  }
  
  try {
    const userMessage = `## 预设信息
- 名称：${preset.name}
- 描述：${preset.description || '通用润色'}

## 用户输入
${rawInput}

请根据预设特点，判断用户输入是否需要补充信息。`;

    const response = await llmClient.chat({
      config: apiConfig,
      messages: [
        { role: 'system', content: CHECKER_ANALYZE_PROMPT },
        { role: 'user', content: userMessage },
      ],
      model: apiConfig.model,
      temperature: 0.5,
      maxTokens: 1000,
      timeoutMs: 60000,
    });

    const analysis = await parseStructuredOutput(
      response.content,
      validateCheckerAnalyzeOutput,
      {
        apiConfig,
        timeoutMs: 60000,
        repair: { enabled: true, temperature: 0, maxTokens: 1200 },
      }
    );

    if (analysis.isClear) {
      return { needsClarification: false, clarifiedPrompt: rawInput, success: true };
    }
    
    const questions = analysis.questions || [];

    return {
      needsClarification: true,
      questions,
      reason: analysis.reason,
      clarifiedPrompt: rawInput,
      success: true,
    };
  } catch (err) {
    return {
      needsClarification: false,
      clarifiedPrompt: rawInput,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// 将用户选择转换为上下文文本
function selectionsToContext(selections: UserSelection[], questions: ClarificationQuestion[]): string {
  return selections.map(sel => {
    const question = questions.find(q => q.id === sel.questionId);
    if (!question) return '';
    const option = question.options.find(o => o.id === sel.selectedOptionId);
    if (!option) return '';
    
    const questionText = question.question.replace('？', '').replace('?', '');
    // 如果是"其它"选项且有自定义输入，使用用户输入的内容
    if (option.allowCustomInput && sel.customInput) {
      return `${questionText}: ${sel.customInput}`;
    }
    return `${questionText}: ${option.label}`;
  }).filter(Boolean).join('\n');
}

// 第二阶段：根据用户回答补全 prompt
export async function completePrompt(
  input: CheckerInput,
  apiConfig: APIConfig,
  questions: ClarificationQuestion[] = []
): Promise<CheckerResult> {
  const { rawInput, preset, userSelections } = input;

  if (!userSelections || userSelections.length === 0) {
    return { needsClarification: false, clarifiedPrompt: rawInput, success: true };
  }

  const additionalContext = selectionsToContext(userSelections, questions);

  if (!apiConfig.apiKey) {
    // 没有 API Key，简单拼接
    const combined = `${rawInput}\n\n补充信息：\n${additionalContext}`;
    return { needsClarification: false, clarifiedPrompt: combined, success: true };
  }

  try {
    const userMessage = `预设类型：${preset.name}

原始输入：
${rawInput}

用户补充的信息：
${additionalContext}

请整合这些信息，输出一个更完整的提示词草稿。`;

    const response = await llmClient.chat({
      config: apiConfig,
      messages: [
        { role: 'system', content: CHECKER_COMPLETE_PROMPT },
        { role: 'user', content: userMessage },
      ],
      model: apiConfig.model,
      temperature: 0.5,
      maxTokens: 1000,
      timeoutMs: 60000,
    });
    return { needsClarification: false, clarifiedPrompt: response.content, success: true };
  } catch (err) {
    // 失败时简单拼接
    const combined = `${rawInput}\n\n补充信息：\n${additionalContext}`;
    return { 
      needsClarification: false, 
      clarifiedPrompt: combined, 
      success: false, 
      error: err instanceof Error ? err.message : String(err) 
    };
  }
}

// 兼容旧接口：直接运行完整流程（跳过卡片交互）
export async function runChecker(
  input: CheckerInput,
  apiConfig: APIConfig
): Promise<CheckerResult> {
  const { rawInput, preset } = input;

  if (!rawInput.trim()) {
    return { needsClarification: false, clarifiedPrompt: '', success: false, error: '输入为空' };
  }

  if (!apiConfig.apiKey) {
    return { needsClarification: false, clarifiedPrompt: rawInput, success: false, error: '未配置 API Key' };
  }

  const userMessage = `预设类型：${preset.name}
预设描述：${preset.description || '通用润色'}
预设 System Prompt 摘要：${preset.systemPrompt.substring(0, 300)}...

用户输入：
${rawInput}

请澄清并补全上述输入，输出一个更清晰的提示词草稿。`;

  try {
    const response = await llmClient.chat({
      config: apiConfig,
      messages: [
        { role: 'system', content: CHECKER_COMPLETE_PROMPT },
        { role: 'user', content: userMessage },
      ],
      model: apiConfig.model,
      temperature: 0.5,
      maxTokens: 1000,
      timeoutMs: 60000,
    });
    return { needsClarification: false, clarifiedPrompt: response.content, success: true };
  } catch (err) {
    return { 
      needsClarification: false,
      clarifiedPrompt: rawInput, 
      success: false, 
      error: err instanceof Error ? err.message : String(err) 
    };
  }
}
