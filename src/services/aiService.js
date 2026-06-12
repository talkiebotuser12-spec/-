/**
 * خدمة الذكاء الاصطناعي للرد التلقائي
 * تدعم: Gemini API و Groq API
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, STORAGE_KEYS } from '../constants/config';
import { buildConversationContext } from '../utils/logger';

/**
 * إرسال طلب للذكاء الاصطناعي
 * @param {string} message - رسالة العميل
 * @param {string} clientId - معرف العميل للذاكرة
 * @returns {Promise<string>} رد الذكاء الاصطناعي
 */
export const sendToAI = async (message, clientId) => {
  try {
    // الحصول على الإعدادات
    const provider = await AsyncStorage.getItem(STORAGE_KEYS.API_PROVIDER) || 'gemini';
    const systemPrompt = await AsyncStorage.getItem(STORAGE_KEYS.SYSTEM_PROMPT) || '';
    const model = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_MODEL) || '';

    // بناء سياق المحادثة من ذاكرة العميل
    const conversationContext = await buildConversationContext(clientId);

    // دمج السياق مع المطالبة النظامية
    const fullSystemPrompt = conversationContext
      ? `${systemPrompt}\n\n${conversationContext}`
      : systemPrompt;

    if (provider === 'groq') {
      return await sendToGroq(message, fullSystemPrompt, model);
    } else {
      return await sendToGemini(message, fullSystemPrompt, model);
    }
  } catch (error) {
    console.error('❌ خطأ في إرسال الطلب للذكاء الاصطناعي:', error);
    throw error;
  }
};

/**
 * إرسال طلب لـ Gemini API
 * @param {string} message - رسالة العميل
 * @param {string} systemPrompt - المطالبة النظامية
 * @param {string} model - اسم النموذج
 */
const sendToGemini = async (message, systemPrompt, model) => {
  const apiKey = await AsyncStorage.getItem(STORAGE_KEYS.GEMINI_API_KEY);

  if (!apiKey) {
    throw new Error('مفتاح API الخاص بـ Gemini غير موجود');
  }

  const modelName = model || API_CONFIG.GEMINI.DEFAULT_MODEL;
  const url = `${API_CONFIG.GEMINI.BASE_URL}/${modelName}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\nالرسالة الجديدة: ${message}` }]
      }
    ],
    generationConfig: {
      temperature: 0.9,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`خطأ Gemini: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();

  // استخراج نص الرد
  if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text;
  }

  throw new Error('لم يتم العثور على رد من Gemini');
};

/**
 * إرسال طلب لـ Groq API
 * @param {string} message - رسالة العميل
 * @param {string} systemPrompt - المطالبة النظامية
 * @param {string} model - اسم النموذج
 */
const sendToGroq = async (message, systemPrompt, model) => {
  const apiKey = await AsyncStorage.getItem(STORAGE_KEYS.GROQ_API_KEY);

  if (!apiKey) {
    throw new Error('مفتاح API الخاص بـ Groq غير موجود');
  }

  const modelName = model || API_CONFIG.GROQ.DEFAULT_MODEL;
  const url = `${API_CONFIG.GROQ.BASE_URL}/chat/completions`;

  const requestBody = {
    model: modelName,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ],
    temperature: 0.9,
    max_tokens: 2048,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`خطأ Groq: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();

  // استخراج نص الرد
  if (data.choices && data.choices[0]?.message?.content) {
    return data.choices[0].message.content;
  }

  throw new Error('لم يتم العثور على رد من Groq');
};

/**
 * اختبار الاتصال بـ API
 * @param {string} provider - مزود الخدمة (gemini/groq)
 * @returns {Promise<boolean>}
 */
export const testAPIConnection = async (provider) => {
  try {
    if (provider === 'gemini') {
      const apiKey = await AsyncStorage.getItem(STORAGE_KEYS.GEMINI_API_KEY);
      if (!apiKey) return false;

      const url = `${API_CONFIG.GEMINI.BASE_URL}/gemini-pro:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'اختبار' }] }]
        }),
      });

      return response.ok;
    } else {
      const apiKey = await AsyncStorage.getItem(STORAGE_KEYS.GROQ_API_KEY);
      if (!apiKey) return false;

      const response = await fetch(`${API_CONFIG.GROQ.BASE_URL}/models`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });

      return response.ok;
    }
  } catch (error) {
    console.error('❌ خطأ في اختبار الاتصال:', error);
    return false;
  }
};

/**
 * الحصول على حالة API
 * @returns {Promise<Object>} حالة API
 */
export const getAPIStatus = async () => {
  const provider = await AsyncStorage.getItem(STORAGE_KEYS.API_PROVIDER) || 'gemini';
  const isConnected = await testAPIConnection(provider);

  return {
    provider,
    isConnected,
    timestamp: new Date().toISOString(),
  };
};