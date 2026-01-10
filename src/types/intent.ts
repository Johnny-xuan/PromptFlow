// Intent Checker 类型定义
import { getTranslations, type Language } from '../lib/i18n';

export interface ClarificationOption {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  allowCustomInput?: boolean;
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  type?: 'single' | 'multiple';
  options: ClarificationOption[];
}

export interface UserSelection {
  questionId: string;
  selectedOptionId: string;
  selectedOptionIds?: string[];
  customInput?: string;
}

// Get preset clarifications based on language
export function getPresetClarifications(lang: Language): Record<string, ClarificationQuestion[]> {
  const t = getTranslations(lang);
  return {
    default: [
      {
        id: 'purpose',
        question: t.clarification.purposeQuestion,
        options: [
          { id: 'coding', label: t.clarification.purposeCoding, icon: '💻' },
          { id: 'writing', label: t.clarification.purposeWriting, icon: '✍️' },
          { id: 'analysis', label: t.clarification.purposeAnalysis, icon: '📊' },
          { id: 'chat', label: t.clarification.purposeChat, icon: '💬' },
        ],
      },
    ],
    concise: [
      {
        id: 'keep',
        question: t.clarification.keepQuestion,
        options: [
          { id: 'core', label: t.clarification.keepCore, icon: '🎯' },
          { id: 'action', label: t.clarification.keepAction, icon: '✅' },
          { id: 'data', label: t.clarification.keepData, icon: '📈' },
          { id: 'all', label: t.clarification.keepAll, icon: '📦' },
        ],
      },
    ],
    technical: [
      {
        id: 'tech_domain',
        question: t.clarification.techQuestion,
        options: [
          { id: 'frontend', label: t.clarification.techFrontend, icon: '🌐' },
          { id: 'backend', label: t.clarification.techBackend, icon: '⚙️' },
          { id: 'data', label: t.clarification.techData, icon: '🤖' },
          { id: 'devops', label: t.clarification.techDevops, icon: '🚀' },
          { id: 'general', label: t.clarification.techGeneral, icon: '💻' },
        ],
      },
    ],
    creative: [
      {
        id: 'platform',
        question: t.clarification.platformQuestion,
        options: [
          { id: 'social', label: t.clarification.platformSocial, icon: '📱' },
          { id: 'blog', label: t.clarification.platformBlog, icon: '📝' },
          { id: 'ad', label: t.clarification.platformAd, icon: '📢' },
          { id: 'story', label: t.clarification.platformStory, icon: '📖' },
        ],
      },
    ],
    academic: [
      {
        id: 'field',
        question: t.clarification.fieldQuestion,
        options: [
          { id: 'science', label: t.clarification.fieldScience, icon: '🔬' },
          { id: 'social', label: t.clarification.fieldSocial, icon: '📚' },
          { id: 'business', label: t.clarification.fieldBusiness, icon: '💼' },
          { id: 'general', label: t.clarification.fieldGeneral, icon: '🎓' },
        ],
      },
    ],
    friendly: [
      {
        id: 'scenario',
        question: t.clarification.scenarioQuestion,
        options: [
          { id: 'support', label: t.clarification.scenarioSupport, icon: '🎧' },
          { id: 'sales', label: t.clarification.scenarioSales, icon: '🤝' },
          { id: 'teaching', label: t.clarification.scenarioTeaching, icon: '👨‍🏫' },
          { id: 'casual', label: t.clarification.scenarioCasual, icon: '☕' },
        ],
      },
    ],
  };
}

// Legacy export for backward compatibility (defaults to zh-CN)
export const PRESET_CLARIFICATIONS = getPresetClarifications('zh-CN');

// 判断输入是否需要澄清的阈值（字符数）
export const MIN_INPUT_LENGTH_FOR_SKIP = 100;

// 检测输入是否足够清晰（简单规则，不调用 AI）
export function needsClarification(input: string, presetId: string): boolean {
  // 输入足够长且结构化，跳过澄清
  if (input.length >= MIN_INPUT_LENGTH_FOR_SKIP) {
    // 检查是否已经有结构化特征
    const hasStructure = 
      input.includes('：') || input.includes(':') ||
      input.includes('1.') || input.includes('- ') ||
      input.includes('要求') || input.includes('请') ||
      input.includes('Role') || input.includes('Task');
    if (hasStructure) return false;
  }
  
  // 输入太短，需要澄清
  if (input.length < 20) return true;
  
  // 检查预设是否有对应的澄清问题
  return !!PRESET_CLARIFICATIONS[presetId];
}

// 获取预设对应的澄清问题
export function getClarificationQuestions(presetId: string): ClarificationQuestion[] {
  return PRESET_CLARIFICATIONS[presetId] || PRESET_CLARIFICATIONS['default'] || [];
}

// 将用户选择转换为上下文提示
export function selectionsToContext(selections: UserSelection[]): string {
  const contextParts: string[] = [];
  
  for (const sel of selections) {
    const questions = Object.values(PRESET_CLARIFICATIONS).flat();
    const question = questions.find(q => q.id === sel.questionId);
    if (!question) continue;
    
    const option = question.options.find(o => o.id === sel.selectedOptionId);
    if (!option) continue;
    
    contextParts.push(`${question.question.replace('？', '')}: ${option.label}`);
  }
  
  return contextParts.join('\n');
}
