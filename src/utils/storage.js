/**
 * خدمات التخزين والإعدادات
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, APP_CONFIG, DEFAULT_SYSTEM_PROMPT } from '../constants/config';

/**
 * الحصول على جميع الإعدادات
 * @returns {Promise<Object>}
 */
export const getAllSettings = async () => {
  try {
    const [
      apiProvider,
      geminiApiKey,
      groqApiKey,
      selectedModel,
      systemPrompt,
      minDelay,
      maxDelay,
      typingIndicator,
      backgroundService,
    ] = await AsyncStorage.multiGet([
      STORAGE_KEYS.API_PROVIDER,
      STORAGE_KEYS.GEMINI_API_KEY,
      STORAGE_KEYS.GROQ_API_KEY,
      STORAGE_KEYS.SELECTED_MODEL,
      STORAGE_KEYS.SYSTEM_PROMPT,
      STORAGE_KEYS.MIN_DELAY,
      STORAGE_KEYS.MAX_DELAY,
      STORAGE_KEYS.TYPING_INDICATOR,
      STORAGE_KEYS.BACKGROUND_SERVICE,
    ]);

    return {
      apiProvider: apiProvider[1] || 'gemini',
      geminiApiKey: geminiApiKey[1] || '',
      groqApiKey: groqApiKey[1] || '',
      selectedModel: selectedModel[1] || '',
      systemPrompt: systemPrompt[1] || DEFAULT_SYSTEM_PROMPT,
      minDelay: minDelay[1] ? parseInt(minDelay[1]) : APP_CONFIG.DEFAULT_MIN_DELAY,
      maxDelay: maxDelay[1] ? parseInt(maxDelay[1]) : APP_CONFIG.DEFAULT_MAX_DELAY,
      typingIndicator: typingIndicator[1] === 'true',
      backgroundService: backgroundService[1] === 'true',
    };
  } catch (error) {
    console.error('❌ خطأ في الحصول على الإعدادات:', error);
    return getDefaultSettings();
  }
};

/**
 * الحصول على الإعدادات الافتراضية
 * @returns {Object}
 */
export const getDefaultSettings = () => ({
  apiProvider: 'gemini',
  geminiApiKey: '',
  groqApiKey: '',
  selectedModel: '',
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  minDelay: APP_CONFIG.DEFAULT_MIN_DELAY,
  maxDelay: APP_CONFIG.DEFAULT_MAX_DELAY,
  typingIndicator: true,
  backgroundService: false,
});

/**
 * حفظ إعداد واحد
 * @param {string} key - مفتاح الإعداد
 * @param {any} value - قيمة الإعداد
 */
export const saveSetting = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, String(value));
    console.log(`✅ تم حفظ: ${key}`);
  } catch (error) {
    console.error(`❌ خطأ في حفظ ${key}:`, error);
  }
};

/**
 * حفظ جميع الإعدادات
 * @param {Object} settings - كائن الإعدادات
 */
export const saveAllSettings = async (settings) => {
  try {
    const pairs = [
      [STORAGE_KEYS.API_PROVIDER, settings.apiProvider],
      [STORAGE_KEYS.GEMINI_API_KEY, settings.geminiApiKey],
      [STORAGE_KEYS.GROQ_API_KEY, settings.groqApiKey],
      [STORAGE_KEYS.SELECTED_MODEL, settings.selectedModel],
      [STORAGE_KEYS.SYSTEM_PROMPT, settings.systemPrompt],
      [STORAGE_KEYS.MIN_DELAY, String(settings.minDelay)],
      [STORAGE_KEYS.MAX_DELAY, String(settings.maxDelay)],
      [STORAGE_KEYS.TYPING_INDICATOR, String(settings.typingIndicator)],
      [STORAGE_KEYS.BACKGROUND_SERVICE, String(settings.backgroundService)],
    ];

    await AsyncStorage.multiSet(pairs);
    console.log('✅ تم حفظ جميع الإعدادات');
  } catch (error) {
    console.error('❌ خطأ في حفظ الإعدادات:', error);
  }
};

/**
 * حذف جميع الإعدادات
 */
export const clearAllSettings = async () => {
  try {
    const keys = Object.values(STORAGE_KEYS);
    await AsyncStorage.multiRemove(keys);
    console.log('✅ تم حذف جميع الإعدادات');
  } catch (error) {
    console.error('❌ خطأ في حذف الإعدادات:', error);
  }
};

/**
 * إنشاء معرف فريد للرسائل
 * @returns {string}
 */
export const generateMessageId = () => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * توليد تأخير عشوائي بين الحد الأدنى والأقصى
 * @param {number} min - الحد الأدنى (بالثواني)
 * @param {number} max - الحد الأقصى (بالثواني)
 * @returns {number} التأخير بالمللي ثانية
 */
export const generateRandomDelay = (min, max) => {
  const seconds = Math.random() * (max - min) + min;
  return Math.floor(seconds * 1000);
};