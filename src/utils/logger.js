// خدمة إدارة الذاكرة للعملاء
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, APP_CONFIG } from '../constants/config';

/**
 * كائن الذاكرة للعميل
 * @typedef {Object} ClientMemory
 * @property {string} clientId - معرف العميل (رقم الهاتف أو اسم المحادثة)
 * @property {string} clientName - اسم العميل
 * @property {Array<Message>} messages - قائمة الرسائل
 * @property {number} totalInteractions - عدد التفاعلات
 * @property {string} lastInteraction - آخر وقت تفاعل
 * @property {string} notes - ملاحظات إضافية عن العميل
 */

/**
 * كائن الرسالة
 * @typedef {Object} Message
 * @property {string} id - معرف الرسالة
 * @property {string} text - نص الرسالة
 * @property {string} sender - مرسل الرسالة (user/ai/client)
 * @property {number} timestamp - وقت الرسالة
 * @property {boolean} isRead - هل تم قرائتها
 */

/**
 * الحصول على جميع ذكريات العملاء
 * @returns {Promise<Object>} كائن يحتوي على جميع ذكريات العملاء
 */
export const getAllClientMemories = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CLIENT_MEMORIES);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('❌ خطأ في الحصول على ذكريات العملاء:', error);
    return {};
  }
};

/**
 * الحصول على ذاكرة عميل محدد
 * @param {string} clientId - معرف العميل
 * @returns {Promise<ClientMemory|null>}
 */
export const getClientMemory = async (clientId) => {
  try {
    const memories = await getAllClientMemories();
    return memories[clientId] || null;
  } catch (error) {
    console.error('❌ خطأ في الحصول على ذاكرة العميل:', error);
    return null;
  }
};

/**
 * حفظ أو تحديث ذاكرة العميل
 * @param {string} clientId - معرف العميل
 * @param {ClientMemory} memory - بيانات الذاكرة
 */
export const saveClientMemory = async (clientId, memory) => {
  try {
    const memories = await getAllClientMemories();

    // تحديث أو إنشاء ذاكرة العميل
    const existingMemory = memories[clientId] || {
      clientId,
      clientName: memory.clientName || clientId,
      messages: [],
      totalInteractions: 0,
      lastInteraction: new Date().toISOString(),
      notes: '',
    };

    // دمج الرسائل الجديدة
    const updatedMemory = {
      ...existingMemory,
      clientName: memory.clientName || existingMemory.clientName,
      messages: memory.messages || existingMemory.messages,
      totalInteractions: existingMemory.totalInteractions + 1,
      lastInteraction: new Date().toISOString(),
      notes: memory.notes || existingMemory.notes,
    };

    // الحفاظ على الحد الأقصى للرسائل
    if (updatedMemory.messages.length > APP_CONFIG.MAX_MESSAGES_PER_CLIENT) {
      updatedMemory.messages = updatedMemory.messages.slice(-APP_CONFIG.MAX_MESSAGES_PER_CLIENT);
    }

    memories[clientId] = updatedMemory;
    await AsyncStorage.setItem(STORAGE_KEYS.CLIENT_MEMORIES, JSON.stringify(memories));

    console.log(`✅ تم حفظ ذاكرة العميل: ${clientId}`);
    return updatedMemory;
  } catch (error) {
    console.error('❌ خطأ في حفظ ذاكرة العميل:', error);
    throw error;
  }
};

/**
 * إضافة رسالة جديدة لذاكرة العميل
 * @param {string} clientId - معرف العميل
 * @param {Message} message - الرسالة الجديدة
 */
export const addMessageToClientMemory = async (clientId, message) => {
  try {
    const memory = await getClientMemory(clientId);

    if (!memory) {
      // إنشاء ذاكرة جديدة للعميل
      await saveClientMemory(clientId, {
        clientId,
        clientName: clientId,
        messages: [message],
      });
    } else {
      // إضافة الرسالة للقائمة الموجودة
      memory.messages.push(message);
      memory.totalInteractions += 1;
      memory.lastInteraction = new Date().toISOString();
      await saveClientMemory(clientId, memory);
    }

    console.log(`✅ تمت إضافة الرسالة لذاكرة العميل: ${clientId}`);
  } catch (error) {
    console.error('❌ خطأ في إضافة رسالة لذاكرة العميل:', error);
  }
};

/**
 * بناء سياق المحادثة للذكاء الاصطناعي
 * @param {string} clientId - معرف العميل
 * @param {number} maxMessages - الحد الأقصى للرسائل المرسلة
 * @returns {Promise<string>} نص السياق
 */
export const buildConversationContext = async (clientId, maxMessages = 10) => {
  try {
    const memory = await getClientMemory(clientId);

    if (!memory || memory.messages.length === 0) {
      return '';
    }

    // الحصول على آخر الرسائل
    const recentMessages = memory.messages.slice(-maxMessages);

    // بناء نص السياق
    let context = `محادثة سابقة مع ${memory.clientName}:\n`;
    context += `عدد التفاعلات: ${memory.totalInteractions}\n`;
    context += `آخر تفاعل: ${new Date(memory.lastInteraction).toLocaleString('ar-SA')}\n\n`;

    if (memory.notes) {
      context += `ملاحظات: ${memory.notes}\n\n`;
    }

    context += 'سجل المحادثة:\n';

    recentMessages.forEach((msg, index) => {
      const senderLabel = msg.sender === 'client' ? 'العميل' :
                          msg.sender === 'ai' ? 'المساعد' : 'أنا';
      const time = new Date(msg.timestamp).toLocaleTimeString('ar-SA');
      context += `[${time}] ${senderLabel}: ${msg.text}\n`;
    });

    return context;
  } catch (error) {
    console.error('❌ خطأ في بناء سياق المحادثة:', error);
    return '';
  }
};

/**
 * تحديث ملاحظات العميل
 * @param {string} clientId - معرف العميل
 * @param {string} notes - الملاحظات الجديدة
 */
export const updateClientNotes = async (clientId, notes) => {
  try {
    const memory = await getClientMemory(clientId);
    if (memory) {
      memory.notes = notes;
      await saveClientMemory(clientId, memory);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ خطأ في تحديث ملاحظات العميل:', error);
    return false;
  }
};

/**
 * حذف ذاكرة عميل محدد
 * @param {string} clientId - معرف العميل
 */
export const deleteClientMemory = async (clientId) => {
  try {
    const memories = await getAllClientMemories();
    delete memories[clientId];
    await AsyncStorage.setItem(STORAGE_KEYS.CLIENT_MEMORIES, JSON.stringify(memories));
    console.log(`✅ تم حذف ذاكرة العميل: ${clientId}`);
    return true;
  } catch (error) {
    console.error('❌ خطأ في حذف ذاكرة العميل:', error);
    return false;
  }
};

/**
 * حذف جميع الذكريات
 */
export const clearAllMemories = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.CLIENT_MEMORIES);
    console.log('✅ تم حذف جميع ذكريات العملاء');
    return true;
  } catch (error) {
    console.error('❌ خطأ في حذف جميع الذكريات:', error);
    return false;
  }
};

/**
 * الحصول على قائمة العملاء
 * @returns {Promise<Array>} قائمة العملاء
 */
export const getClientsList = async () => {
  try {
    const memories = await getAllClientMemories();
    return Object.values(memories).map(m => ({
      clientId: m.clientId,
      clientName: m.clientName,
      totalInteractions: m.totalInteractions,
      lastInteraction: m.lastInteraction,
      messageCount: m.messages.length,
    })).sort((a, b) =>
      new Date(b.lastInteraction) - new Date(a.lastInteraction)
    );
  } catch (error) {
    console.error('❌ خطأ في الحصول على قائمة العملاء:', error);
    return [];
  }
};

/**
 * تصدير ذاكرة العميل كـ JSON
 * @param {string} clientId - معرف العميل
 */
export const exportClientMemory = async (clientId) => {
  try {
    const memory = await getClientMemory(clientId);
    return memory ? JSON.stringify(memory, null, 2) : null;
  } catch (error) {
    console.error('❌ خطأ في تصدير ذاكرة العميل:', error);
    return null;
  }
};