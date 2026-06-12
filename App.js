/**
 * نقطة الدخول الرئيسية للتطبيق
 * WhatsApp AI Replier - الرد التلقائي على WhatsApp Web
 */
import React, { useEffect } from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// استيراد الشاشات
import Dashboard from './src/screens/Dashboard';
import Settings from './src/screens/Settings';

// استيراد خدمات الخلفية
import { registerBackgroundTask } from './src/tasks/backgroundTask';

// ثوابت الألوان
const COLORS = {
  PRIMARY: '#25D366',
  PRIMARY_DARK: '#128C7E',
  BACKGROUND: '#1A1A1A',
  SURFACE: '#2D2D2D',
};

// السمة المظلمة
const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: COLORS.PRIMARY,
    primaryContainer: COLORS.PRIMARY_DARK,
    background: COLORS.BACKGROUND,
    surface: COLORS.SURFACE,
    surfaceVariant: '#3D3D3D',
    onPrimary: '#FFFFFF',
    onBackground: '#FFFFFF',
    onSurface: '#FFFFFF',
  },
};

// إنشاء_STACK الموجه
const Stack = createNativeStackNavigator();

/**
 * تنقل التطبيق
 */
const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.BACKGROUND,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        contentStyle: {
          backgroundColor: COLORS.BACKGROUND,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="Dashboard"
        component={Dashboard}
        options={{
          title: 'WhatsApp AI Replier',
          headerShown: true,
          headerRight: () => null,
        }}
      />
      <Stack.Screen
        name="Settings"
        component={Settings}
        options={{
          title: 'الإعدادات',
          headerBackTitle: 'رجوع',
        }}
      />
    </Stack.Navigator>
  );
};

/**
 * المكون الرئيسي للتطبيق
 */
const App = () => {
  // تسجيل مهمة الخلفية عند بدء التشغيل
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // تسجيل مهمة الموقع في الخلفية
        registerBackgroundTask();
        console.log('✅ تم تهيئة التطبيق بنجاح');
      } catch (error) {
        console.error('❌ خطأ في تهيئة التطبيق:', error);
      }
    };

    initializeApp();
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={darkTheme}>
        <NavigationContainer>
          <StatusBar
            barStyle="light-content"
            backgroundColor={COLORS.BACKGROUND}
          />
          <AppNavigator />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
};

export default App;