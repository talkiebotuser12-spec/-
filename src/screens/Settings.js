/**
 * شاشة الإعدادات - تخصيص الذكاء الاصطناعي والخدمة
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Card,
  Text,
  TextInput,
  Switch,
  Button,
  SegmentedButtons,
  Menu,
  Divider,
  IconButton,
  Banner,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  STORAGE_KEYS,
  AVAILABLE_MODELS,
  DEFAULT_SYSTEM_PROMPT,
  COLORS,
  APP_CONFIG,
} from '../constants/config';
import { testAPIConnection } from '../services/aiService';
import { saveAllSettings, getAllSettings } from '../utils/storage';
import { clearAllMemories, getClientsList } from '../utils/logger';

const Settings = ({ navigation }) => {
  // الإعدادات
  const [apiProvider, setApiProvider] = useState('gemini');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [groqApiKey, setGroqApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [minDelay, setMinDelay] = useState(APP_CONFIG.DEFAULT_MIN_DELAY.toString());
  const [maxDelay, setMaxDelay] = useState(APP_CONFIG.DEFAULT_MAX_DELAY.toString());
  const [typingIndicator, setTypingIndicator] = useState(true);

  // حالة الواجهة
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingApi, setTestingApi] = useState(false);
  const [apiTestResult, setApiTestResult] = useState(null);
  const [modelMenuVisible, setModelMenuVisible] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState({ gemini: false, groq: false });

  // تحميل الإعدادات عند بدء التشغيل
  useEffect(() => {
    loadSettings();
  }, []);

  // تحميل الإعدادات من التخزين
  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await getAllSettings();

      setApiProvider(settings.apiProvider);
      setGeminiApiKey(settings.geminiApiKey);
      setGroqApiKey(settings.groqApiKey);
      setSelectedModel(settings.selectedModel);
      setSystemPrompt(settings.systemPrompt);
      setMinDelay(settings.minDelay.toString());
      setMaxDelay(settings.maxDelay.toString());
      setTypingIndicator(settings.typingIndicator);
    } catch (error) {
      console.error('❌ خطأ في تحميل الإعدادات:', error);
      Alert.alert('خطأ', 'فشل في تحميل الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  // حفظ الإعدادات
  const handleSave = async () => {
    try {
      setSaving(true);

      // التحقق من القيم
      const minDelayValue = parseInt(minDelay);
      const maxDelayValue = parseInt(maxDelay);

      if (isNaN(minDelayValue) || isNaN(maxDelayValue)) {
        Alert.alert('خطأ', 'الرجاء إدخال أرقام صحيحة للتأخير');
        return;
      }

      if (minDelayValue < 0 || maxDelayValue < 0) {
        Alert.alert('خطأ', 'الرجاء إدخال قيم موجبة للتأخير');
        return;
      }

      if (minDelayValue > maxDelayValue) {
        Alert.alert('خطأ', 'الحد الأدنى للتأخير يجب أن يكون أقل من الحد الأقصى');
        return;
      }

      // حفظ الإعدادات
      await saveAllSettings({
        apiProvider,
        geminiApiKey,
        groqApiKey,
        selectedModel,
        systemPrompt,
        minDelay: minDelayValue,
        maxDelay: maxDelayValue,
        typingIndicator,
        backgroundService: false,
      });

      Alert.alert('نجاح', 'تم حفظ الإعدادات بنجاح');
    } catch (error) {
      console.error('❌ خطأ في حفظ الإعدادات:', error);
      Alert.alert('خطأ', 'فشل في حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  // اختبار الاتصال بالـ API
  const handleTestAPI = async () => {
    try {
      setTestingApi(true);
      setApiTestResult(null);

      const isConnected = await testAPIConnection(apiProvider);

      setApiTestResult(isConnected);

      if (isConnected) {
        Alert.alert('نجاح', `تم الاتصال بـ ${apiProvider === 'gemini' ? 'Gemini' : 'Groq'} بنجاح`);
      } else {
        Alert.alert('خطأ', 'فشل في الاتصال. تأكد من صحة مفتاح API');
      }
    } catch (error) {
      console.error('❌ خطأ في اختبار API:', error);
      Alert.alert('خطأ', 'فشل في الاتصال بالـ API');
      setApiTestResult(false);
    } finally {
      setTestingApi(false);
    }
  };

  // إعادة تعيين للإعدادات الافتراضية
  const handleReset = () => {
    Alert.alert(
      'تأكيد',
      'هل أنت متأكد من إعادة تعيين جميع الإعدادات؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'إعادة تعيين',
          style: 'destructive',
          onPress: async () => {
            setApiProvider('gemini');
            setGeminiApiKey('');
            setGroqApiKey('');
            setSelectedModel('');
            setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
            setMinDelay(APP_CONFIG.DEFAULT_MIN_DELAY.toString());
            setMaxDelay(APP_CONFIG.DEFAULT_MAX_DELAY.toString());
            setTypingIndicator(true);
            await saveAllSettings({
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
            Alert.alert('نجاح', 'تم إعادة تعيين الإعدادات');
          },
        },
      ]
    );
  };

  // حذف جميع ذكريات العملاء
  const handleClearMemories = async () => {
    try {
      const clients = await getClientsList();

      Alert.alert(
        'تأكيد',
        `هل أنت متأكد من حذف ذكريات ${clients.length} عميل؟`,
        [
          { text: 'إلغاء', style: 'cancel' },
          {
            text: 'حذف',
            style: 'destructive',
            onPress: async () => {
              await clearAllMemories();
              Alert.alert('نجاح', 'تم حذف جميع ذكريات العملاء');
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ خطأ في حذف الذكريات:', error);
      Alert.alert('خطأ', 'فشل في حذف الذكريات');
    }
  };

  // الحصول على النماذج المتاحة للمزود الحالي
  const getAvailableModels = () => {
    return apiProvider === 'gemini' ? AVAILABLE_MODELS.GEMINI : AVAILABLE_MODELS.GROQ;
  };

  // عرض النماذج المتاحة
  const getModelName = (modelId) => {
    const models = getAvailableModels();
    const model = models.find((m) => m.id === modelId);
    return model ? model.name : modelId;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>جاري تحميل الإعدادات...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* اختيار مزود API */}
        <Card style={styles.card}>
          <Card.Title title="اختيار مزود الذكاء الاصطناعي" />
          <Card.Content>
            <SegmentedButtons
              value={apiProvider}
              onValueChange={(value) => {
                setApiProvider(value);
                setSelectedModel('');
              }}
              buttons={[
                {
                  value: 'gemini',
                  label: 'Gemini',
                  icon: 'brain',
                },
                {
                  value: 'groq',
                  label: 'Groq',
                  icon: 'cpu-64-bit',
                },
              ]}
              style={styles.segmentedButtons}
            />
          </Card.Content>
        </Card>

        {/* مفاتيح API */}
        <Card style={styles.card}>
          <Card.Title title="مفاتيح API" />
          <Card.Content>
            {apiProvider === 'gemini' ? (
              <View style={styles.inputContainer}>
                <TextInput
                  label="Gemini API Key"
                  value={geminiApiKey}
                  onChangeText={setGeminiApiKey}
                  secureTextEntry={!showApiKeys.gemini}
                  mode="outlined"
                  style={styles.input}
                  placeholder="أدخل مفتاح Gemini API"
                  right={
                    <TextInput.Icon
                      icon={showApiKeys.gemini ? 'eye-off' : 'eye'}
                      onPress={() => setShowApiKeys({ ...showApiKeys, gemini: !showApiKeys.gemini })}
                    />
                  }
                />
              </View>
            ) : (
              <View style={styles.inputContainer}>
                <TextInput
                  label="Groq API Key"
                  value={groqApiKey}
                  onChangeText={setGroqApiKey}
                  secureTextEntry={!showApiKeys.groq}
                  mode="outlined"
                  style={styles.input}
                  placeholder="أدخل مفتاح Groq API"
                  right={
                    <TextInput.Icon
                      icon={showApiKeys.groq ? 'eye-off' : 'eye'}
                      onPress={() => setShowApiKeys({ ...showApiKeys, groq: !showApiKeys.groq })}
                    />
                  }
                />
              </View>
            )}

            <Button
              mode="outlined"
              onPress={handleTestAPI}
              loading={testingApi}
              disabled={testingApi}
              style={styles.testButton}
              icon="connection"
            >
              اختبار الاتصال
            </Button>

            {apiTestResult !== null && (
              <Text
                style={[
                  styles.testResult,
                  { color: apiTestResult ? COLORS.SUCCESS : COLORS.ERROR },
                ]}
              >
                {apiTestResult ? '✅ الاتصال ناجح' : '❌ فشل الاتصال'}
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* اختيار النموذج */}
        <Card style={styles.card}>
          <Card.Title title="اختيار النموذج" />
          <Card.Content>
            <Menu
              visible={modelMenuVisible}
              onDismiss={() => setModelMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setModelMenuVisible(true)}
                  style={styles.modelButton}
                  icon="chevron-down"
                  contentStyle={styles.modelButtonContent}
                >
                  {selectedModel ? getModelName(selectedModel) : 'اختر نموذجاً'}
                </Button>
              }
            >
              {getAvailableModels().map((model) => (
                <Menu.Item
                  key={model.id}
                  onPress={() => {
                    setSelectedModel(model.id);
                    setModelMenuVisible(false);
                  }}
                  title={model.name}
                />
              ))}
            </Menu>
          </Card.Content>
        </Card>

        {/* المطالبة النظامية */}
        <Card style={styles.card}>
          <Card.Title
            title="المطالبة النظامية (System Prompt)"
            subtitle="حدد شخصية وقواعد الذكاء الاصطناعي"
          />
          <Card.Content>
            <TextInput
              value={systemPrompt}
              onChangeText={setSystemPrompt}
              mode="outlined"
              multiline
              numberOfLines={8}
              style={styles.textArea}
              placeholder="أدخل المطالبة النظامية هنا..."
            />
          </Card.Content>
        </Card>

        {/* محاكاة السلوك البشري */}
        <Card style={styles.card}>
          <Card.Title title="محاكاة السلوك البشري" />
          <Card.Content>
            <View style={styles.delayContainer}>
              <View style={styles.delayInput}>
                <TextInput
                  label="الحد الأدنى للتأخير (ثانية)"
                  value={minDelay}
                  onChangeText={setMinDelay}
                  keyboardType="numeric"
                  mode="outlined"
                />
              </View>
              <View style={styles.delayInput}>
                <TextInput
                  label="الحد الأقصى للتأخير (ثانية)"
                  value={maxDelay}
                  onChangeText={setMaxDelay}
                  keyboardType="numeric"
                  mode="outlined"
                />
              </View>
            </View>

            <View style={styles.switchRow}>
              <Text variant="bodyMedium">إظهار مؤشر "يكتب..." أثناء الانتظار</Text>
              <Switch
                value={typingIndicator}
                onValueChange={setTypingIndicator}
                color={COLORS.PRIMARY}
              />
            </View>

            <Text variant="bodySmall" style={styles.hint}>
              يتم اختيار وقت عشوائي بين الحد الأدنى والأقصى لمحاكاة الكتابة البشرية
            </Text>
          </Card.Content>
        </Card>

        {/* إدارة الذاكرة */}
        <Card style={styles.card}>
          <Card.Title title="إدارة ذاكرة العملاء" />
          <Card.Content>
            <Banner
              visible={true}
              icon="information"
              style={styles.banner}
            >
              يتم حفظ آخر 50 رسالة لكل عميل لاستخدامها في سياق المحادثة
            </Banner>

            <Button
              mode="outlined"
              onPress={handleClearMemories}
              textColor={COLORS.ERROR}
              style={styles.clearButton}
              icon="delete"
            >
              حذف جميع ذكريات العملاء
            </Button>
          </Card.Content>
        </Card>

        {/* الأزرار */}
        <View style={styles.buttonsContainer}>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            style={styles.saveButton}
            icon="content-save"
          >
            حفظ الإعدادات
          </Button>

          <Button
            mode="outlined"
            onPress={handleReset}
            style={styles.resetButton}
            icon="refresh"
          >
            إعادة تعيين
          </Button>
        </View>

        {/* معلومات التطبيق */}
        <View style={styles.appInfo}>
          <Text variant="bodySmall" style={styles.version}>
            WhatsApp AI Replier v2.0.0
          </Text>
          <Text variant="bodySmall" style={styles.copyright}>
            صنع بـ ❤️ باستخدام Expo
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#2D2D2D',
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  inputContainer: {
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#3D3D3D',
  },
  testButton: {
    marginTop: 8,
  },
  testResult: {
    marginTop: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  modelButton: {
    justifyContent: 'flex-start',
  },
  modelButtonContent: {
    flexDirection: 'row-reverse',
  },
  textArea: {
    backgroundColor: '#3D3D3D',
    minHeight: 150,
  },
  delayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  delayInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  hint: {
    marginTop: 8,
    color: '#888',
    fontStyle: 'italic',
  },
  banner: {
    backgroundColor: '#3D3D3D',
    marginBottom: 16,
  },
  clearButton: {
    borderColor: COLORS.ERROR,
  },
  buttonsContainer: {
    marginTop: 16,
  },
  saveButton: {
    marginBottom: 12,
    backgroundColor: COLORS.PRIMARY,
  },
  resetButton: {
    borderColor: '#888',
  },
  appInfo: {
    marginTop: 32,
    alignItems: 'center',
  },
  version: {
    color: '#888',
  },
  copyright: {
    color: '#666',
    marginTop: 4,
  },
});

export default Settings;