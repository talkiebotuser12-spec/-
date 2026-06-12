// ثوابت التطبيق
export const APP_CONFIG = {
  WHATSAPP_URL: 'https://web.whatsapp.com',
  // User-Agent لإحضار WhatsApp Web كنسخة سطح المكتب
  DESKTOP_USER_AGENT: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  // الفاصل الزمني لفحص الرسائل الجديدة (بالمللي ثانية)
  MESSAGE_CHECK_INTERVAL: 2000,
  // الحد الأقصى لعدد الرسائل المحفوظة لكل عميل
  MAX_MESSAGES_PER_CLIENT: 50,
  // الوقت الافتراضي للتأخير (بالثواني)
  DEFAULT_MIN_DELAY: 3,
  DEFAULT_MAX_DELAY: 8,
};

// إعدادات API
export const API_CONFIG = {
  GEMINI: {
    BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/models',
    DEFAULT_MODEL: 'gemini-1.5-flash',
  },
  GROQ: {
    BASE_URL: 'https://api.groq.com/openai/v1',
    DEFAULT_MODEL: 'llama-3.1-70b-versatile',
  },
};

// مفاتيح التخزين في AsyncStorage
export const STORAGE_KEYS = {
  API_PROVIDER: '@api_provider',
  GEMINI_API_KEY: '@gemini_api_key',
  GROQ_API_KEY: '@groq_api_key',
  SELECTED_MODEL: '@selected_model',
  SYSTEM_PROMPT: '@system_prompt',
  MIN_DELAY: '@min_delay',
  MAX_DELAY: '@max_delay',
  TYPING_INDICATOR: '@typing_indicator',
  BACKGROUND_SERVICE: '@background_service',
  CLIENT_MEMORIES: '@client_memories',
};

// اسم مهمة الموقع في الخلفية
export const LOCATION_TASK_NAME = 'LOCATION_TRACKING_TASK';

// النماذج المتاحة
export const AVAILABLE_MODELS = {
  GEMINI: [
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (سريع)' },
    { id: 'gemini-1.5-flash-latest', name: 'Gemini 1.5 Flash Latest' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Experimental' },
  ],
  GROQ: [
    { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B Versatile' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (سريع)' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
    { id: 'gemma2-9b-it', name: 'Gemma 2 9B' },
  ],
};

// المطالبة النظامية الافتراضية
export const DEFAULT_SYSTEM_PROMPT = `أنت مساعد ذكي للرد على رسائل WhatsApp.
- رد بأسلوب طبيعي ومهذب
- لا تكشف أنك ذكاء اصطناعي
- اجعل ردودك قصيرة ومباشرة
- استخدم اللغة العربية الفصحى
- تجنب المعلومات الحساسة`;

// ألوان التطبيق
export const COLORS = {
  PRIMARY: '#25D366',
  PRIMARY_DARK: '#128C7E',
  BACKGROUND: {
    light: '#FFFFFF',
    dark: '#1A1A1A',
  },
  SURFACE: {
    light: '#F5F5F5',
    dark: '#2D2D2D',
  },
  TEXT: {
    light: '#000000',
    dark: '#FFFFFF',
  },
  ERROR: '#FF5252',
  SUCCESS: '#4CAF50',
  WARNING: '#FFC107',
};