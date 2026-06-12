# WhatsApp AI Replier - دليل التثبيت والتشغيل

## نظرة عامة
تطبيق React Native باستخدام Expo للرد التلقائي على رسائل WhatsApp Web باستخدام الذكاء الاصطناعي (Gemini أو Groq).

## الميزات الرئيسية
- ✅ الرد التلقائي على رسائل WhatsApp Web
- ✅ ذاكرة منفصلة لكل عميل
- ✅ اختيار مزود الذكاء الاصطناعي (Gemini/Groq)
- ✅ تخصيص المطالبة النظامية
- ✅ محاكاة السلوك البشري (تأخير عشوائي + مؤشر الكتابة)
- ✅ خدمة خلفية للحفاظ على نشاط التطبيق
- ✅ إعدادات شاملة

## التثبيت

### 1. تثبيت الحزم
```bash
cd whatsapp-ai-replier
npm install
```

### 2. تشغيل التطبيق
```bash
# للتطوير على الجهاز
npx expo start

# لبناء APK
npx expo build:android

# لبناء لـ iOS
npx expo build:ios
```

### 3. إعداد_keys API
1. افتح التطبيق
2. انتقل إلى "الإعدادات"
3. أدخل مفتاح API الخاص بـ Gemini أو Groq
4. اختر النموذج المناسب
5. اختبر الاتصال

## هيكل المشروع

```
whatsapp-ai-replier/
├── App.js                    # نقطة الدخول الرئيسية
├── app.json                  # إعدادات Expo
├── package.json              # الحزم依赖
├── babel.config.js           # إعدادات Babel
├── src/
│   ├── screens/
│   │   ├── Dashboard.js      # لوحة التحكم
│   │   └── Settings.js      # الإعدادات
│   ├── services/
│   │   └── aiService.js      # خدمة الذكاء الاصطناعي
│   ├── tasks/
│   │   └── backgroundTask.js # مهمة الموقع في الخلفية
│   ├── utils/
│   │   ├── logger.js         # إدارة ذاكرة العملاء
│   │   └── storage.js        # خدمات التخزين
│   └── constants/
│       └── config.js         # الثوابت والإعدادات
└── README.md                 # هذا الملف
```

## إعداد Codemagic للـ iOS

### app.json المطلوب
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.whatsappaireplier.app",
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "...",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "...",
        "UIBackgroundModes": ["location", "fetch"]
      }
    }
  }
}
```

### خطوات البناء على Codemagic
1. اربط المستودع مع Codemagic
2. أضف متغيرات البيئة للمفاتيح السرية
3. استخدم `expo build:ios` أو `eas build`

## ملاحظات مهمة

### بخصوص WhatsApp Web
- يجب تسجيل الدخول يدوياً مرة واحدة على WhatsApp Web
- User-Agent مضبوط لنسخة سطح المكتب لتجنب التحويل للموبايل
- JavaScript محقون لمراقبة الرسائل وإرسال الردود

### بخصوص الخدمة في الخلفية
- تستخدم `expo-location` و `expo-task-manager`
- يتطلب إذن الموقع في الخلفية
- يحافظ على نشاط JavaScript engine

### بخصوص الذاكرة
- تُحفظ آخر 50 رسالة لكل عميل
- تُستخدم في سياق المحادثة للذكاء الاصطناعي
- يمكن حذفها من الإعدادات

## Troubleshooting

### المشكلة: WhatsApp يطلب مسح البيانات
الحل: استخدم User-Agent صحيح للسطح المكتب

### المشكلة: التطبيق يتوقف في الخلفية
الحل: تأكد من إعطاء إذن الموقع في الخلفية

### المشكلة: لا يرد على الرسائل
الحل: تحقق من:
1. حالة WhatsApp Web (متصل)
2. مفتاح API صحيح
3. الاتصال بالإنترنت

## الترخيص
MIT License

## النسخة
v2.0.0 - مع دعم الذاكرة لكل عميل