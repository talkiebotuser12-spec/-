/**
 * مهمة الموقع في الخلفية لـ iOS
 * تُستخدم للحفاظ على نشاط التطبيق في الخلفية
 */
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { LOCATION_TASK_NAME, APP_CONFIG } from '../constants/config';

// حالة المهمة
let isTaskRunning = false;

/**
 * تسجيل مهمة الموقع في الخلفية
 */
export const registerBackgroundTask = () => {
  TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
      console.error('❌ خطأ في مهمة الموقع:', error);
      return;
    }

    if (data) {
      // البيانات المستلمة من الموقع
      const { locations } = data;
      if (locations && locations.length > 0) {
        // الموقع يعمل بنجاح - هذا يحافظ على نشاط التطبيق
        console.log(`📍 تم تحديث الموقع: ${locations[0].coords.latitude}, ${locations[0].coords.longitude}`);
      }
    }
  });

  console.log('✅ تم تسجيل مهمة الموقع في الخلفية');
};

/**
 * بدء تتبع الموقع في الخلفية
 * هذه الوظيفة تحافظ على نشاط التطبيق حتى عند قفل الهاتف
 */
export const startBackgroundLocation = async () => {
  try {
    // التحقق من_permissions الموقع
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

    if (foregroundStatus !== 'granted') {
      console.error('❌ تم رفض إذن الموقع في المقدمة');
      return false;
    }

    // طلب إذن الموقع في الخلفية
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

    if (backgroundStatus !== 'granted') {
      console.warn('⚠️ تم رفض إذن الموقع في الخلفية - قد لا يعمل التطبيق في الخلفية');
    }

    // التحقق من تسجيل المهمة
    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);

    if (!isRegistered) {
      registerBackgroundTask();
    }

    // بدء تحديثات الموقع في الخلفية
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      // استخدام دقة متوازنة لتوفير البطارية
      accuracy: Location.Accuracy.Balanced,
      // المسافة بالدقة متر قبل إرسال تحديث
      distanceInterval: 100,
      // الوقت بالمللي ثانية بين التحديثات
      deferredUpdatesInterval: APP_CONFIG.MESSAGE_CHECK_INTERVAL,
      // إظهار المؤشر في شريط الحالة
      showsBackgroundLocationIndicator: false,
    });

    isTaskRunning = true;
    console.log('✅ تم بدء تتبع الموقع في الخلفية');

    return true;
  } catch (error) {
    console.error('❌ خطأ في بدء تتبع الموقع:', error);
    return false;
  }
};

/**
 * إيقاف تتبع الموقع في الخلفية
 */
export const stopBackgroundLocation = async () => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);

    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      console.log('✅ تم إيقاف تتبع الموقع في الخلفية');
    }

    isTaskRunning = false;
    return true;
  } catch (error) {
    console.error('❌ خطأ في إيقاف تتبع الموقع:', error);
    return false;
  }
};

/**
 * التحقق من حالة مهمة الموقع
 * @returns {Promise<boolean>}
 */
export const isBackgroundTaskRunning = async () => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    return isRegistered && isTaskRunning;
  } catch (error) {
    console.error('❌ خطأ في التحقق من حالة المهمة:', error);
    return false;
  }
};

/**
 * الحصول على الموقع الحالي
 * @returns {Promise<Location.LocationObject|null>}
 */
export const getCurrentLocation = async () => {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return location;
  } catch (error) {
    console.error('❌ خطأ في الحصول على الموقع الحالي:', error);
    return null;
  }
};