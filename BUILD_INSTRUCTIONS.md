# 📱 دليل تجميع ملف IPA لـ WhatsApp AI Replier

## نظرة عامة

هذا الدليل يشرح كيفية تجميع تطبيق React Native (Expo) لبناء ملف IPA يمكن تثبيته على أجهزة iOS أو رفعه على App Store.

---

## 📋 المتطلبات الأساسية

### 1. حساب Apple Developer
- حساب Apple Developer (مجاني أو مدفوع)
- Membership في Apple Developer Program للنشر على App Store

### 2. الأدوات المطلوبة
```bash
# Xcode (من App Store)
# Node.js 18+
# npm أو yarn
# EAS CLI
npm install -g eas-cli
```

### 3. بيانات الاعتماد
- Apple Team ID
- Signing Certificate
- Provisioning Profile

---

## 🔧 طريقة 1: استخدام EAS Build (موصى به)

### الخطوة 1: تسجيل الدخول
```bash
cd whatsapp-ai-replier
eas login
```

### الخطوة 2: إعداد المشروع
```bash
eas build:configure --platform ios
```

### الخطوة 3: البناء
```bash
# للاختبار (Development)
eas build --platform ios --profile preview

# للإنتاج
eas build --platform ios --profile production
```

### الخطوة 4: تحميل IPA
- انتقل إلى https://expo.dev
- حمل ملف IPA من Build artifacts

---

## 🔧 طريقة 2: استخدام Codemagic (CI/CD)

### الخطوة 1: ربط المستودع
1. أنشئ حساب على https://codemagic.io
2. اربط مستودع GitHub/GitLab/Bitbucket

### الخطوة 2: إضافة المتغيرات البيئية
في Codemagic، أضف:
- `EAS_TOKEN`: رمز EAS API (احصل عليه من https://expo.dev/settings/api)
- `APPLE_ID`: معرف Apple
- `ASC_APP_ID`: معرف App Store Connect

### الخطوة 3: بدء البناء
```bash
# أو استخدم ملف codemagic.yaml المرفق
eas build --platform ios --profile preview --non-interactive
```

---

## 🔧 طريقة 3: البناء المحلي (Xcode)

### الخطوة 1: Prebuild
```bash
npx expo prebuild --platform ios
```

### الخطوة 2: تثبيت CocoaPods
```bash
cd ios
pod install
cd ..
```

### الخطوة 3: البناء
```bash
# اكتشف المحاكيات المتاحة
xcrun simctl list devices available

# ابنِ للأرشيف
xcodebuild -workspace ios/WhatsAppAIReplier.xcworkspace \
    -scheme WhatsAppAIReplier \
    -configuration Release \
    -archivePath build/WhatsAppAIReplier.xcarchive \
    archive
```

### الخطوة 4: تصدير IPA
```bash
xcodebuild -exportArchive \
    -archivePath build/WhatsAppAIReplier.xcarchive \
    -exportPath build \
    -exportOptionsPlist ios/ExportOptions.plist
```

---

## 📁 هيكل المشروع النهائي

```
whatsapp-ai-replier/
├── App.js                      # نقطة الدخول
├── app.json                    # إعدادات Expo
├── package.json                # الحزم
├── eas.json                    # إعدادات EAS Build
├── codemagic.yaml             # إعدادات CI/CD
├── build.sh                    # سكريبت البناء اليدوي
├── local-build.sh              # سكريبت البناء المحلي
├── src/
│   ├── screens/
│   │   ├── Dashboard.js        # لوحة التحكم + WebView
│   │   └── Settings.js         # الإعدادات
│   ├── services/
│   │   └── aiService.js        # خدمة AI
│   ├── tasks/
│   │   └── backgroundTask.js   # مهمة الخلفية
│   ├── utils/
│   │   ├── logger.js           # إدارة الذاكرة
│   │   └── storage.js          # التخزين
│   └── constants/
│       └── config.js           # الثوابت
├── ios/
│   ├── Podfile
│   └── ExportOptions.plist
└── assets/
    ├── icon.png
    ├── splash.png
    └── adaptive-icon.png
```

---

## 🔐 إعداد Signing في Xcode

### بعد Prebuild:
1. افتح `ios/WhatsAppAIReplier.xcworkspace` في Xcode
2. اختر WhatsAppAIReplier في Navigator
3. انتقل إلى Signing & Capabilities
4. فعّل "Automatically manage signing"
5. اختر Team الخاص بك
6. تأكد من Bundle ID: `com.whatsappaireplier.app`

---

## 🚀 خطوات ما بعد البناء

### 1. الاختبار على Simulator
```bash
# اكتشف المحاكي
xcrun simctl list devices available

# ثبّت IPA
xcrun simctl boot "iPhone 15"
xcrun simctl install booted build/WhatsAppAIReplier.ipa
xcrun simctl launch booted com.whatsappaireplier.app
```

### 2. التثبيت على جهاز حقيقي
- افتح Finder/ iTunes
- اسحب ملف IPA
- أو استخدم Fastlane

### 3. الرفع على App Store
```bash
# باستخدام EAS
eas submit --platform ios --latest

# أو باستخدام Transporter (من App Store)
```

---

## ⚠️ المشاكل الشائعة وحلولها

### المشكلة: "No matching version found"
```bash
npm install @babel/core@latest
```

### المشكلة: "pod install failed"
```bash
cd ios
pod install --repo-update
```

### المشكلة: "Code signing failed"
- تأكد من Bundle ID فريد
- تحقق من Provisioning Profile
- تحقق من Team ID

### المشكلة: "expo-location permissions"
- أضف في `app.json`:
```json
"plugins": [
  ["expo-location", {
    "locationAlwaysAndWhenInUsePermission": "..."
  }]
]
```

---

## 📞 الدعم

- Documentation: https://docs.expo.dev
- EAS Build: https://expo.dev/eas
- Codemagic: https://codemagic.io/docs

---

## 📝 ملاحظات مهمة

1. **ذاكرة العملاء**: يتم حفظ آخر 50 رسالة لكل عميل
2. **الخدمة في الخلفية**: تستخدم تتبع الموقع لمنع تعليق التطبيق
3. **WhatsApp Web**: يتم تحميله كنسخة سطح المكتب لتجنب التحويل للموبايل

---

**النوع**: React Native + Expo SDK 51
**الإصدار**: 2.0.0
**تاريخ الإنشاء**: 2026-06-12