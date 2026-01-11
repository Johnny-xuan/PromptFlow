// i18n - 国际化支持
export type Language = 'zh-CN' | 'en';

export interface Translations {
  // 通用
  common: {
    save: string;
    cancel: string;
    confirm: string;
    delete: string;
    edit: string;
    add: string;
    search: string;
    close: string;
    copy: string;
    copied: string;
    loading: string;
    error: string;
    success: string;
    reset: string;
    preview: string;
    apply: string;
  };
  // 主界面
  app: {
    inputPlaceholder: string;
    outputPlaceholder: string;
    favorites: string;
    templates: string;
    polish: string;
    result: string;
  };
  // 设置
  settings: {
    title: string;
    ui: string;
    api: string;
    polish: string;
    storage: string;
    // UI 设置
    hotkey: string;
    hotkeyNotCustomizable: string;
    theme: string;
    themeLight: string;
    themeDark: string;
    themeSystem: string;
    fontSize: string;
    language: string;
    closeAfterCopy: string;
    // API 设置
    provider: string;
    apiKey: string;
    apiKeyPlaceholder: string;
    model: string;
    baseUrl: string;
    baseUrlPlaceholder: string;
    temperature: string;
    maxTokens: string;
    // 润色设置
    currentPreset: string;
    presets: string;
    addPreset: string;
    editPreset: string;
    deletePreset: string;
    presetName: string;
    presetDescription: string;
    systemPrompt: string;
    builtIn: string;
    custom: string;
    aiCreate: string;
    aiCreateDesc: string;
    // 存储设置
    repoPath: string;
    openInFinder: string;
    changeFolder: string;
  };
  // 弹窗
  dialogs: {
    favoritePrompts: string;
    templateList: string;
    savePrompt: string;
    quickAddFavorite: string;
    quickAddTemplate: string;
    noFavorites: string;
    noTemplates: string;
    noMatch: string;
    title: string;
    content: string;
    description: string;
    tags: string;
    tagsPlaceholder: string;
    items: string;
  };
  // 内置预设
  presets: {
    default: { name: string; description: string };
    precise: { name: string; description: string };
    frontendUI: { name: string; description: string };
    bugReport: { name: string; description: string };
    refactor: { name: string; description: string };
  };
  // 澄清问题
  clarification: {
    purposeQuestion: string;
    purposeCoding: string;
    purposeWriting: string;
    purposeAnalysis: string;
    purposeChat: string;
    keepQuestion: string;
    keepCore: string;
    keepAction: string;
    keepData: string;
    keepAll: string;
    techQuestion: string;
    techFrontend: string;
    techBackend: string;
    techData: string;
    techDevops: string;
    techGeneral: string;
    platformQuestion: string;
    platformSocial: string;
    platformBlog: string;
    platformAd: string;
    platformStory: string;
    fieldQuestion: string;
    fieldScience: string;
    fieldSocial: string;
    fieldBusiness: string;
    fieldGeneral: string;
    scenarioQuestion: string;
    scenarioSupport: string;
    scenarioSales: string;
    scenarioTeaching: string;
    scenarioCasual: string;
  };
  // 错误与提示
  messages: {
    errorPrefix: string;
    intentAnalysisFailed: string;
    accessibilityRequired: string;
    accessibilityDesc: string;
    accessibilityHint: string;
    accessibilityNote: string;
    openSettings: string;
    later: string;
    apiKeyRequired: string;
    connectionSuccess: string;
    repoInitSuccess: string;
    saveTo: string;
    deleteConfirm: string;
    cannotUndo: string;
    noMatch: string;
    selectTemplate: string;
    selectTemplateDesc: string;
    createFromScratch: string;
    saving: string;
    applyTemplate: string;
    editTemplate: string;
    deleteTemplate: string;
    enterTitle: string;
    customizePolishStyle: string;
    polishPresets: string;
    baseUrlOptional: string;
    enterOrSelectModel: string;
  };
}

const zhCN: Translations = {
  common: {
    save: '保存',
    cancel: '取消',
    confirm: '确认',
    delete: '删除',
    edit: '编辑',
    add: '添加',
    search: '搜索',
    close: '关闭',
    copy: '复制',
    copied: '已复制',
    loading: '加载中...',
    error: '错误',
    success: '成功',
    reset: '重置',
    preview: '预览',
    apply: '应用',
  },
  app: {
    inputPlaceholder: '输入你的想法，让 AI 帮你润色成专业的 Prompt...',
    outputPlaceholder: '润色后的 Prompt 将显示在这里',
    favorites: '常用',
    templates: '模板',
    polish: '润色',
    result: '结果',
  },
  settings: {
    title: '设置',
    ui: '界面',
    api: 'API',
    polish: '润色',
    storage: '存储',
    hotkey: '全局快捷键',
    hotkeyNotCustomizable: '暂不支持自定义',
    theme: '主题',
    themeLight: '浅色',
    themeDark: '深色',
    themeSystem: '跟随系统',
    fontSize: '字体大小',
    language: '语言',
    closeAfterCopy: '复制后自动关闭窗口',
    provider: '服务商',
    apiKey: 'API Key',
    apiKeyPlaceholder: '输入你的 API Key',
    model: '模型',
    baseUrl: '自定义 API 地址',
    baseUrlPlaceholder: 'https://api.example.com/v1',
    temperature: '温度',
    maxTokens: '最大 Token',
    currentPreset: '当前预设',
    presets: '预设列表',
    addPreset: '添加预设',
    editPreset: '编辑预设',
    deletePreset: '删除预设',
    presetName: '预设名称',
    presetDescription: '预设描述',
    systemPrompt: 'System Prompt',
    builtIn: '内置',
    custom: '自定义',
    aiCreate: 'AI 生成',
    aiCreateDesc: '描述风格，AI 生成润色用的 System Prompt',
    repoPath: '仓库路径',
    openInFinder: '在 Finder 中打开',
    changeFolder: '更改文件夹',
  },
  dialogs: {
    favoritePrompts: '常用 Prompt',
    templateList: '模板列表',
    savePrompt: '保存 Prompt',
    quickAddFavorite: '新增常用',
    quickAddTemplate: '新增模板',
    noFavorites: '还没有收藏的 Prompt',
    noTemplates: '还没有模板',
    noMatch: '没有找到匹配的 Prompt',
    title: '标题',
    content: '内容',
    description: '描述',
    tags: '标签',
    tagsPlaceholder: '回车添加',
    items: '项',
  },
  presets: {
    default: { name: '默认增强', description: '通用 Prompt 优化，结构化输出' },
    precise: { name: '精准表达', description: '去冗余、理逻辑、清晰化' },
    frontendUI: { name: '前端 UI', description: '将口语化 UI 描述转为精确的前端术语' },
    bugReport: { name: 'Bug 描述', description: '将模糊的 bug 描述转为清晰的问题报告' },
    refactor: { name: '复盘重构', description: '将模糊的重构需求转为清晰的改进方案' },
  },
  clarification: {
    purposeQuestion: '这个 Prompt 主要用于？',
    purposeCoding: '写代码',
    purposeWriting: '写内容',
    purposeAnalysis: '分析/总结',
    purposeChat: '对话/问答',
    keepQuestion: '精简时优先保留？',
    keepCore: '核心观点',
    keepAction: '行动要点',
    keepData: '关键数据',
    keepAll: '尽量都保留',
    techQuestion: '技术领域？',
    techFrontend: '前端开发',
    techBackend: '后端/系统',
    techData: '数据/AI',
    techDevops: '运维/部署',
    techGeneral: '通用技术',
    platformQuestion: '发布在哪里？',
    platformSocial: '社交媒体',
    platformBlog: '博客/公众号',
    platformAd: '广告文案',
    platformStory: '故事/小说',
    fieldQuestion: '学科领域？',
    fieldScience: '理工科',
    fieldSocial: '社科/人文',
    fieldBusiness: '商科/管理',
    fieldGeneral: '通用学术',
    scenarioQuestion: '对话场景？',
    scenarioSupport: '客服支持',
    scenarioSales: '销售咨询',
    scenarioTeaching: '教学指导',
    scenarioCasual: '日常闲聊',
  },
  messages: {
    errorPrefix: '错误',
    intentAnalysisFailed: '意图分析失败',
    accessibilityRequired: '需要开启辅助功能权限',
    accessibilityDesc: '为了使用全局快捷键唤起 PromptFlow，需要授予辅助功能权限。',
    accessibilityHint: '系统偏好设置 → 隐私与安全性 → 辅助功能 → 勾选 PromptFlow',
    accessibilityNote: '授权后可能需要重启应用才能生效。',
    openSettings: '打开系统设置',
    later: '稍后',
    apiKeyRequired: '请先在设置中配置 API Key',
    connectionSuccess: '连接成功',
    repoInitSuccess: '仓库初始化成功',
    saveTo: '保存到',
    deleteConfirm: '确定删除',
    cannotUndo: '此操作不可撤销',
    noMatch: '没有找到匹配项',
    selectTemplate: '选择模板',
    selectTemplateDesc: '选择一个模板快速开始，或从空白创建',
    createFromScratch: '从空白创建',
    saving: '保存中...',
    applyTemplate: '应用模板',
    editTemplate: '编辑模板',
    deleteTemplate: '删除模板',
    enterTitle: '请输入标题',
    customizePolishStyle: '自定义你的润色风格',
    polishPresets: '润色预设',
    baseUrlOptional: '可选，留空使用默认',
    enterOrSelectModel: '请输入或选择模型',
  },
};

const en: Translations = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    close: 'Close',
    copy: 'Copy',
    copied: 'Copied',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    reset: 'Reset',
    preview: 'Preview',
    apply: 'Apply',
  },
  app: {
    inputPlaceholder: 'Enter your idea, let AI polish it into a professional prompt...',
    outputPlaceholder: 'Polished prompt will appear here',
    favorites: 'Favorites',
    templates: 'Templates',
    polish: 'Polish',
    result: 'Result',
  },
  settings: {
    title: 'Settings',
    ui: 'UI',
    api: 'API',
    polish: 'Polish',
    storage: 'Storage',
    hotkey: 'Global Hotkey',
    hotkeyNotCustomizable: 'Not customizable yet',
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
    fontSize: 'Font Size',
    language: 'Language',
    closeAfterCopy: 'Close window after copy',
    provider: 'Provider',
    apiKey: 'API Key',
    apiKeyPlaceholder: 'Enter your API Key',
    model: 'Model',
    baseUrl: 'Custom API URL',
    baseUrlPlaceholder: 'https://api.example.com/v1',
    temperature: 'Temperature',
    maxTokens: 'Max Tokens',
    currentPreset: 'Current Preset',
    presets: 'Presets',
    addPreset: 'Add Preset',
    editPreset: 'Edit Preset',
    deletePreset: 'Delete Preset',
    presetName: 'Preset Name',
    presetDescription: 'Description',
    systemPrompt: 'System Prompt',
    builtIn: 'Built-in',
    custom: 'Custom',
    aiCreate: 'AI Generate',
    aiCreateDesc: 'Describe style, AI generates System Prompt for polishing',
    repoPath: 'Repository Path',
    openInFinder: 'Open in Finder',
    changeFolder: 'Change Folder',
  },
  dialogs: {
    favoritePrompts: 'Favorite Prompts',
    templateList: 'Templates',
    savePrompt: 'Save Prompt',
    quickAddFavorite: 'Add Favorite',
    quickAddTemplate: 'Add Template',
    noFavorites: 'No favorite prompts yet',
    noTemplates: 'No templates yet',
    noMatch: 'No matching prompts found',
    title: 'Title',
    content: 'Content',
    description: 'Description',
    tags: 'Tags',
    tagsPlaceholder: 'Press Enter to add',
    items: 'items',
  },
  presets: {
    default: { name: 'Default Enhance', description: 'General prompt optimization with structured output' },
    precise: { name: 'Precise Expression', description: 'Remove redundancy, clarify logic' },
    frontendUI: { name: 'Frontend UI', description: 'Convert casual UI descriptions to precise frontend terms' },
    bugReport: { name: 'Bug Report', description: 'Convert vague bug descriptions to clear issue reports' },
    refactor: { name: 'Refactor Review', description: 'Convert vague refactoring needs to clear improvement plans' },
  },
  clarification: {
    purposeQuestion: 'What is this prompt mainly for?',
    purposeCoding: 'Coding',
    purposeWriting: 'Writing',
    purposeAnalysis: 'Analysis/Summary',
    purposeChat: 'Chat/Q&A',
    keepQuestion: 'What to prioritize when simplifying?',
    keepCore: 'Core points',
    keepAction: 'Action items',
    keepData: 'Key data',
    keepAll: 'Keep as much as possible',
    techQuestion: 'Technical domain?',
    techFrontend: 'Frontend',
    techBackend: 'Backend/System',
    techData: 'Data/AI',
    techDevops: 'DevOps',
    techGeneral: 'General Tech',
    platformQuestion: 'Where will it be published?',
    platformSocial: 'Social Media',
    platformBlog: 'Blog/Newsletter',
    platformAd: 'Advertising',
    platformStory: 'Story/Fiction',
    fieldQuestion: 'Academic field?',
    fieldScience: 'Science/Engineering',
    fieldSocial: 'Social Sciences/Humanities',
    fieldBusiness: 'Business/Management',
    fieldGeneral: 'General Academic',
    scenarioQuestion: 'Conversation scenario?',
    scenarioSupport: 'Customer Support',
    scenarioSales: 'Sales Consulting',
    scenarioTeaching: 'Teaching/Tutoring',
    scenarioCasual: 'Casual Chat',
  },
  messages: {
    errorPrefix: 'Error',
    intentAnalysisFailed: 'Intent analysis failed',
    accessibilityRequired: 'Accessibility Permission Required',
    accessibilityDesc: 'To use the global hotkey to summon PromptFlow, accessibility permission is required.',
    accessibilityHint: 'System Preferences → Privacy & Security → Accessibility → Enable PromptFlow',
    accessibilityNote: 'You may need to restart the app after granting permission.',
    openSettings: 'Open Settings',
    later: 'Later',
    apiKeyRequired: 'Please configure API Key in settings first',
    connectionSuccess: 'Connection successful',
    repoInitSuccess: 'Repository initialized successfully',
    saveTo: 'Save to',
    deleteConfirm: 'Confirm delete',
    cannotUndo: 'This action cannot be undone',
    noMatch: 'No matches found',
    selectTemplate: 'Select Template',
    selectTemplateDesc: 'Choose a template to get started, or create from scratch',
    createFromScratch: 'Create from scratch',
    saving: 'Saving...',
    applyTemplate: 'Apply Template',
    editTemplate: 'Edit Template',
    deleteTemplate: 'Delete Template',
    enterTitle: 'Please enter a title',
    customizePolishStyle: 'Customize your polish style',
    polishPresets: 'Polish Presets',
    baseUrlOptional: 'Optional, leave empty for default',
    enterOrSelectModel: 'Enter or select a model',
  },
};

const translations: Record<Language, Translations> = {
  'zh-CN': zhCN,
  'en': en,
};

export function getTranslations(lang: Language): Translations {
  return translations[lang] || translations['zh-CN'];
}

export { translations };
