/**
 * شاشة لوحة التحكم - الصفحة الرئيسية
 * تتضمن WebView لـ WhatsApp Web وحالة الاتصال
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  Text as RNText,
} from 'react-native';
import { WebView } from 'react-native-webview';
import {
  Card,
  Text,
  Switch,
  IconButton,
  Badge,
  FAB,
  Portal,
  Dialog,
  List,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG, STORAGE_KEYS, COLORS } from '../constants/config';
import { startBackgroundLocation, stopBackgroundLocation, isBackgroundTaskRunning } from '../tasks/backgroundTask';
import { sendToAI, getAPIStatus } from '../services/aiService';
import {
  addMessageToClientMemory,
  getClientsList,
  getClientMemory,
  deleteClientMemory,
} from '../utils/logger';
import { generateRandomDelay, generateMessageId } from '../utils/storage';

// JavaScript للمراقبة وإرسال الرسائل
const INJECTED_JAVASCRIPT = `
// ==========================================
// WhatsApp Web - AI Replier Injection Script
// ==========================================

// متغيرات عامة
let lastProcessedMessages = [];
let isProcessing = false;

// دالة لمراقبة الرسائل الجديدة
function checkNewMessages() {
  try {
    // البحث عن جميع المحادثات
    const chatSelectors = document.querySelectorAll('[data-testid="conversation-list-messages"] > div');

    if (!chatSelectors || chatSelectors.length === 0) {
      // طريقة بديلة للبحث عن الرسائل غير المقروءة
      const unreadMessages = document.querySelectorAll('[data-testid="msg-unread"]');
      return extractUnreadMessages(unreadMessages);
    }

    return extractUnreadMessages(chatSelectors);
  } catch (error) {
    console.error('خطأ في فحص الرسائل:', error);
    return [];
  }
}

// استخراج الرسائل غير المقروءة
function extractUnreadMessages(elements) {
  const messages = [];

  elements.forEach(element => {
    try {
      // البحث عن نص الرسالة
      const messageDiv = element.querySelector('[data-testid="message-text"]') || element.querySelector('span[class*="selectable-text"]');
      const messageText = messageDiv ? messageDiv.innerText.trim() : null;

      // البحث عن اسم المرسل
      const senderSpan = element.querySelector('span[title]') || element.querySelector('div[class*="chat-title"]');
      const senderName = senderSpan ? senderSpan.getAttribute('title') || senderSpan.innerText : 'Unknown';

      // البحث عن معرف المحادثة
      const chatLink = element.closest('[data-testid="conversation-panel"]') || element;
      const chatId = element.getAttribute('data-id') || senderName;

      // التحقق من أن الرسالة غير مقروءة
      const isUnread = element.querySelector('[data-testid="msg-checked"]') ||
                      element.classList.contains('unread') ||
                      element.getAttribute('data-testid')?.includes('unread');

      if (messageText && isUnread && !lastProcessedMessages.includes(chatId + messageText)) {
        messages.push({
          text: messageText,
          sender: senderName,
          chatId: chatId,
          timestamp: Date.now()
        });

        // تسجيل الرسالة لمنع معالجتها مرة أخرى
        lastProcessedMessages.push(chatId + messageText);

        // حذف الرسائل القديمة
        if (lastProcessedMessages.length > 100) {
          lastProcessedMessages = lastProcessedMessages.slice(-50);
        }
      }
    } catch (e) {
      // تجاهل الأخطاء الفردية
    }
  });

  return messages;
}

// دالة لإرسال رسالة
function sendMessage(chatId, message) {
  try {
    // البحث عن حقل الإدخال
    const inputSelector = '[data-testid="conversation-compose-box-input"]' ||
                         'div[contenteditable="true"][data-tab="10"]' ||
                         'footer div[contenteditable="true"]';

    const input = document.querySelector(inputSelector);

    if (!input) {
      console.error('لم يتم العثور على حقل الإدخال');
      return false;
    }

    // التركيز على حقل الإدخال
    input.focus();

    // مسح أي نص موجود
    input.innerHTML = '';

    // إدراج النص
    const textNode = document.createTextNode(message);
    input.appendChild(textNode);

    // محاكاة أحداث الإدخال
    const inputEvent = new Event('input', { bubbles: true });
    input.dispatchEvent(inputEvent);

    // البحث عن زر الإرسال
    const sendButton = document.querySelector('[data-testid="send"]') ||
                       document.querySelector('button[data-testid="send"]') ||
                       document.querySelector('[data-testid="send"] span');

    if (sendButton) {
      // الضغط على زر الإرسال
      const clickEvent = new MouseEvent('click', { bubbles: true });
      sendButton.dispatchEvent(clickEvent);

      console.log('تم إرسال الرسالة بنجاح');
      return true;
    }

    // طريقة بديلة: الضغط على Enter
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true
    });
    input.dispatchEvent(enterEvent);

    return true;
  } catch (error) {
    console.error('خطأ في إرسال الرسالة:', error);
    return false;
  }
}

// دالة لمحاكاة الكتابة
function showTypingIndicator(chatId, show) {
  try {
    const selector = show ?
      '[data-testid="typing"]' :
      '[data-testid="conversation-panel"]';

    // البحث عن مؤشر الكتابة وتفعيله/إلغاء تفعيله
    const chatContainer = document.querySelector('[data-testid="conversation-panel-background"]');

    if (chatContainer && show) {
      chatContainer.setAttribute('data-typing', 'true');
    } else if (chatContainer) {
      chatContainer.removeAttribute('data-typing');
    }

    return true;
  } catch (error) {
    console.error('خطأ في مؤشر الكتابة:', error);
    return false;
  }
}

// دالة للحصول على قائمة العملاء
function getClientsList() {
  try {
    const chats = document.querySelectorAll('[data-testid="chat-list"] > div');
    const clients = [];

    chats.forEach(chat => {
      const titleElement = chat.querySelector('span[title]') || chat.querySelector('div[class*="title"]');
      const title = titleElement?.getAttribute('title') || titleElement?.innerText || 'Unknown';

      clients.push({
        name: title,
        id: chat.getAttribute('data-testid') || title,
        hasUnread: !!chat.querySelector('[data-testid="msg-unread"]')
      });
    });

    return clients;
  } catch (error) {
    console.error('خطأ في الحصول على قائمة العملاء:', error);
    return [];
  }
}

// دالة لفتح محادثة محددة
function openChat(chatId) {
  try {
    // البحث عن المحادثة بالنقر عليها
    const chatElement = Array.from(document.querySelectorAll('[data-testid="chat-list"] > div'))
      .find(chat => {
        const title = chat.querySelector('span[title]')?.getAttribute('title');
        return title === chatId || chat.getAttribute('data-testid') === chatId;
      });

    if (chatElement) {
      chatElement.click();
      return true;
    }
    return false;
  } catch (error) {
    console.error('خطأ في فتح المحادثة:', error);
    return false;
  }
}

// التحقق من حالة WhatsApp
function checkWhatsAppStatus() {
  try {
    // البحث عن عناصر تدل على الاتصال
    const sidePanel = document.querySelector('[data-testid="chat-list"]');
    const searchBox = document.querySelector('[data-testid="chat-list-search"]');

    if (sidePanel && searchBox) {
      return 'connected';
    }

    // البحث عن صفحة تسجيل الدخول
    const loginScreen = document.querySelector('[data-testid="landing-title"]');
    if (loginScreen) {
      return 'disconnected';
    }

    return 'loading';
  } catch (error) {
    return 'error';
  }
}

// تصدير الدوال للاستخدام من React Native
window.whatsAppBridge = {
  checkNewMessages,
  sendMessage,
  showTypingIndicator,
  getClientsList,
  openChat,
  checkWhatsAppStatus
};

console.log('✅ WhatsApp Bridge تم تحميله بنجاح');
true;
`;

const Dashboard = ({ navigation, route }) => {
  const webViewRef = useRef(null);
  const [whatsAppStatus, setWhatsAppStatus] = useState('loading');
  const [backgroundActive, setBackgroundActive] = useState(false);
  const [apiStatus, setApiStatus] = useState({ provider: 'gemini', isConnected: false });
  const [clients, setClients] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showClientsDialog, setShowClientsDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientMemory, setShowClientMemory] = useState(false);

  // تحميل الإعدادات عند بدء التشغيل
  useEffect(() => {
    loadInitialData();
  }, []);

  // تحميل البيانات الأولية
  const loadInitialData = async () => {
    try {
      // التحقق من حالة المهمة في الخلفية
      const isRunning = await isBackgroundTaskRunning();
      setBackgroundActive(isRunning);

      // التحقق من حالة API
      const status = await getAPIStatus();
      setApiStatus(status);

      // تحميل قائمة العملاء
      const clientsList = await getClientsList();
      setClients(clientsList);
    } catch (error) {
      console.error('❌ خطأ في تحميل البيانات:', error);
    }
  };

  // معالجة الرسائل الجديدة من WhatsApp WebView
  const handleMessage = useCallback(async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'new_messages' && data.messages && data.messages.length > 0) {
        await processNewMessages(data.messages);
      } else if (data.type === 'status') {
        setWhatsAppStatus(data.status);
      }
    } catch (error) {
      console.error('❌ خطأ في معالجة الرسالة:', error);
    }
  }, []);

  // معالجة الرسائل الجديدة
  const processNewMessages = async (messages) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const settings = await AsyncStorage.multiGet([
        STORAGE_KEYS.API_PROVIDER,
        STORAGE_KEYS.SELECTED_MODEL,
        STORAGE_KEYS.SYSTEM_PROMPT,
        STORAGE_KEYS.MIN_DELAY,
        STORAGE_KEYS.MAX_DELAY,
        STORAGE_KEYS.TYPING_INDICATOR,
      ]);

      const minDelay = parseInt(settings.find(([k]) => k === STORAGE_KEYS.MIN_DELAY)?.[1] || APP_CONFIG.DEFAULT_MIN_DELAY);
      const maxDelay = parseInt(settings.find(([k]) => k === STORAGE_KEYS.MAX_DELAY)?.[1] || APP_CONFIG.DEFAULT_MAX_DELAY);
      const showTyping = settings.find(([k]) => k === STORAGE_KEYS.TYPING_INDICATOR)?.[1] === 'true';

      for (const msg of messages) {
        // إضافة الرسالة لذاكرة العميل
        await addMessageToClientMemory(msg.chatId, {
          id: generateMessageId(),
          text: msg.text,
          sender: 'client',
          timestamp: Date.now(),
          isRead: true,
        });

        // إظهار مؤشر الكتابة إذا كان مفعلاً
        if (showTyping && webViewRef.current) {
          webViewRef.current.injectJavaScript(`window.whatsAppBridge.showTypingIndicator('${msg.chatId}', true);`);
        }

        // إرسال الطلب للذكاء الاصطناعي
        const aiResponse = await sendToAI(msg.text, msg.chatId);

        // تطبيق التأخير العشوائي
        const delay = generateRandomDelay(minDelay, maxDelay);
        await new Promise(resolve => setTimeout(resolve, delay));

        // إخفاء مؤشر الكتابة
        if (showTyping && webViewRef.current) {
          webViewRef.current.injectJavaScript(`window.whatsAppBridge.showTypingIndicator('${msg.chatId}', false);`);
        }

        // فتح المحادثة وإرسال الرد
        if (webViewRef.current) {
          webViewRef.current.injectJavaScript(`
            window.whatsAppBridge.openChat('${msg.chatId}');
            setTimeout(() => {
              window.whatsAppBridge.sendMessage('${msg.chatId}', \`${aiResponse.replace(/`/g, '\\`')}\`);
            }, 1000);
          `);
        }

        // إضافة رد الذكاء الاصطناعي لذاكرة العميل
        await addMessageToClientMemory(msg.chatId, {
          id: generateMessageId(),
          text: aiResponse,
          sender: 'ai',
          timestamp: Date.now(),
          isRead: true,
        });
      }
    } catch (error) {
      console.error('❌ خطأ في معالجة الرسائل:', error);
      Alert.alert('خطأ', 'حدث خطأ في معالجة الرسائل');
    } finally {
      setIsProcessing(false);
    }
  };

  // تبديل حالة الخدمة في الخلفية
  const toggleBackgroundService = async () => {
    try {
      if (backgroundActive) {
        await stopBackgroundLocation();
        setBackgroundActive(false);
      } else {
        const started = await startBackgroundLocation();
        if (started) {
          setBackgroundActive(true);
        } else {
          Alert.alert('خطأ', 'لم يتم بدء الخدمة في الخلفية. تأكد من إعطاء الصلاحيات.');
        }
      }
    } catch (error) {
      console.error('❌ خطأ في تبديل الخدمة:', error);
      Alert.alert('خطأ', 'حدث خطأ في تبديل الخدمة');
    }
  };

  // تحديث البيانات
  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  // عرض تفاصيل ذاكرة العميل
  const showClientMemoryDetails = async (client) => {
    const memory = await getClientMemory(client.clientId);
    if (memory) {
      setSelectedClient(memory);
      setShowClientMemory(true);
    }
  };

  // حذف ذاكرة العميل
  const handleDeleteClientMemory = async (clientId) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف ذاكرة هذا العميل؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            await deleteClientMemory(clientId);
            await loadInitialData();
          },
        },
      ]
    );
  };

  // دالة لتمرير JavaScript إلى WebView
  const runInWebView = (script) => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(script);
    }
  };

  return (
    <View style={styles.container}>
      {/* WebView لـ WhatsApp Web */}
      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: APP_CONFIG.WHATSAPP_URL }}
          style={styles.webView}
          injectedJavaScript={INJECTED_JAVASCRIPT}
          userAgent={APP_CONFIG.DESKTOP_USER_AGENT}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.PRIMARY} />
              <Text style={styles.loadingText}>جاري تحميل WhatsApp...</Text>
            </View>
          )}
        />
      </View>

      {/* لوحة الحالة */}
      <View style={styles.statusPanel}>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* حالة WhatsApp */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.statusRow}>
                <View style={styles.statusInfo}>
                  <IconButton
                    icon="whatsapp"
                    iconColor={whatsAppStatus === 'connected' ? COLORS.SUCCESS : COLORS.WARNING}
                    size={24}
                  />
                  <View>
                    <Text variant="titleMedium">WhatsApp Web</Text>
                    <Text
                      variant="bodySmall"
                      style={{
                        color: whatsAppStatus === 'connected' ? COLORS.SUCCESS : COLORS.WARNING,
                      }}
                    >
                      {whatsAppStatus === 'connected'
                        ? 'متصل'
                        : whatsAppStatus === 'disconnected'
                        ? 'غير متصل - سجّل الدخول'
                        : 'جاري التحميل...'}
                    </Text>
                  </View>
                </View>
                <Badge
                  style={{
                    backgroundColor:
                      whatsAppStatus === 'connected' ? COLORS.SUCCESS : COLORS.WARNING,
                  }}
                >
                  {whatsAppStatus === 'connected' ? 'ON' : 'OFF'}
                </Badge>
              </View>
            </Card.Content>
          </Card>

          {/* حالة الخدمة في الخلفية */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.statusRow}>
                <View style={styles.statusInfo}>
                  <IconButton
                    icon="map-marker"
                    iconColor={backgroundActive ? COLORS.SUCCESS : COLORS.TEXT?.secondary}
                    size={24}
                  />
                  <View>
                    <Text variant="titleMedium">الخدمة في الخلفية</Text>
                    <Text
                      variant="bodySmall"
                      style={{
                        color: backgroundActive ? COLORS.SUCCESS : '#888',
                      }}
                    >
                      {backgroundActive
                        ? 'نشط - يمنع تعليق التطبيق'
                        : 'متوقف'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={backgroundActive}
                  onValueChange={toggleBackgroundService}
                  color={COLORS.PRIMARY}
                />
              </View>
            </Card.Content>
          </Card>

          {/* حالة الذكاء الاصطناعي */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.statusRow}>
                <View style={styles.statusInfo}>
                  <IconButton
                    icon={apiStatus.provider === 'groq' ? 'cpu-64-bit' : 'brain'}
                    iconColor={apiStatus.isConnected ? COLORS.SUCCESS : COLORS.ERROR}
                    size={24}
                  />
                  <View>
                    <Text variant="titleMedium">
                      {apiStatus.provider === 'groq' ? 'Groq AI' : 'Gemini AI'}
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{
                        color: apiStatus.isConnected ? COLORS.SUCCESS : COLORS.ERROR,
                      }}
                    >
                      {apiStatus.isConnected ? 'متصل' : 'غير متصل'}
                    </Text>
                  </View>
                </View>
                <Badge
                  style={{
                    backgroundColor: apiStatus.isConnected ? COLORS.SUCCESS : COLORS.ERROR,
                  }}
                >
                  {apiStatus.isConnected ? 'OK' : 'ERR'}
                </Badge>
              </View>
            </Card.Content>
          </Card>

          {/* قائمة العملاء */}
          <Card style={styles.card}>
            <Card.Content>
              <TouchableOpacity
                onPress={() => setShowClientsDialog(true)}
                style={styles.clientsButton}
              >
                <View style={styles.statusInfo}>
                  <IconButton icon="account-group" iconColor={COLORS.PRIMARY} size={24} />
                  <View>
                    <Text variant="titleMedium">العملاء المسجلون</Text>
                    <Text variant="bodySmall" style={{ color: '#888' }}>
                      {clients.length} عميل في الذاكرة
                    </Text>
                  </View>
                </View>
                <IconButton icon="chevron-left" size={24} />
              </TouchableOpacity>
            </Card.Content>
          </Card>

          {/* مؤشر المعالجة */}
          {isProcessing && (
            <Card style={styles.card}>
              <Card.Content style={styles.processingCard}>
                <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                <Text style={styles.processingText}>جاري معالجة الرسائل...</Text>
              </Card.Content>
            </Card>
          )}
        </ScrollView>
      </View>

      {/* زر الإعدادات */}
      <FAB
        icon="cog"
        style={styles.fab}
        onPress={() => navigation.navigate('Settings')}
      />

      {/* زر إعادة فحص الرسائل */}
      <FAB
        icon="refresh"
        style={styles.fabSecondary}
        onPress={() =>
          runInWebView('window.whatsAppBridge.checkNewMessages();')
        }
      />

      {/* نافذة العملاء */}
      <Portal>
        <Dialog visible={showClientsDialog} onDismiss={() => setShowClientsDialog(false)}>
          <Dialog.Title>العملاء في الذاكرة</Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: 400 }}>
            <ScrollView>
              {clients.length === 0 ? (
                <Text style={styles.emptyText}>لا يوجد عملاء مسجلون</Text>
              ) : (
                clients.map((client, index) => (
                  <React.Fragment key={client.clientId}>
                    <List.Item
                      title={client.clientName}
                      description={`${client.totalInteractions} تفاعل | ${client.messageCount} رسالة`}
                      left={(props) => <List.Icon {...props} icon="account" />}
                      right={() => (
                        <View style={styles.clientActions}>
                          <IconButton
                            icon="eye"
                            size={20}
                            onPress={() => showClientMemoryDetails(client)}
                          />
                          <IconButton
                            icon="delete"
                            size={20}
                            iconColor={COLORS.ERROR}
                            onPress={() => handleDeleteClientMemory(client.clientId)}
                          />
                        </View>
                      )}
                      onPress={() => showClientMemoryDetails(client)}
                    />
                    {index < clients.length - 1 && <Divider />}
                  </React.Fragment>
                ))
              )}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <TouchableOpacity onPress={() => setShowClientsDialog(false)}>
              <Text style={{ color: COLORS.PRIMARY }}>إغلاق</Text>
            </TouchableOpacity>
          </Dialog.Actions>
        </Dialog>

        {/* تفاصيل ذاكرة العميل */}
        <Dialog visible={showClientMemory} onDismiss={() => setShowClientMemory(false)}>
          <Dialog.Title>ذاكرة: {selectedClient?.clientName}</Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: 500 }}>
            <ScrollView>
              {selectedClient?.notes && (
                <View style={styles.notesSection}>
                  <Text variant="titleSmall">ملاحظات:</Text>
                  <Text variant="bodyMedium">{selectedClient.notes}</Text>
                </View>
              )}
              <View style={styles.conversationHistory}>
                <Text variant="titleSmall" style={styles.historyTitle}>
                  سجل المحادثة:
                </Text>
                {selectedClient?.messages?.slice(-10).map((msg, index) => (
                  <View key={msg.id || index} style={styles.messageItem}>
                    <RNText
                      style={[
                        styles.messageSender,
                        {
                          color: msg.sender === 'ai' ? COLORS.PRIMARY : '#666',
                        },
                      ]}
                    >
                      {msg.sender === 'ai' ? 'المساعد' : 'العميل'}:
                    </RNText>
                    <RNText style={styles.messageText}>{msg.text}</RNText>
                    <RNText style={styles.messageTime}>
                      {new Date(msg.timestamp).toLocaleTimeString('ar-SA')}
                    </RNText>
                  </View>
                ))}
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <TouchableOpacity onPress={() => setShowClientMemory(false)}>
              <Text style={{ color: COLORS.PRIMARY }}>إغلاق</Text>
            </TouchableOpacity>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  webViewContainer: {
    height: 300,
    backgroundColor: '#fff',
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.PRIMARY,
  },
  statusPanel: {
    flex: 1,
    padding: 10,
  },
  card: {
    marginBottom: 10,
    backgroundColor: '#2D2D2D',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientsButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientActions: {
    flexDirection: 'row',
  },
  processingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {
    marginLeft: 10,
    color: COLORS.PRIMARY,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    color: '#888',
  },
  notesSection: {
    padding: 10,
    backgroundColor: '#3D3D3D',
    borderRadius: 8,
    marginBottom: 10,
  },
  conversationHistory: {
    padding: 10,
  },
  historyTitle: {
    marginBottom: 10,
    color: '#888',
  },
  messageItem: {
    padding: 10,
    backgroundColor: '#3D3D3D',
    borderRadius: 8,
    marginBottom: 8,
  },
  messageSender: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  messageText: {
    color: '#fff',
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 10,
    color: '#888',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: COLORS.PRIMARY,
  },
  fabSecondary: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    backgroundColor: '#3D3D3D',
  },
});

export default Dashboard;