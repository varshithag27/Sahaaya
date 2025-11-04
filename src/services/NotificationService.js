import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications should behave when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request permissions
export const requestNotificationPermissions = async () => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      return false;
    }

    // For Android, configure notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('medication-reminders', {
        name: 'Medication Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
        enableVibrate: true,
      });
    }

    return true;
  } catch (error) {
    console.log('Permission error:', error);
    return false;
  }
};

// Schedule a medication reminder
export const scheduleMedicationReminder = async (medication) => {
  try {
    const [hours, minutes] = medication.time.split(':');
    
    // Cancel existing notification for this medication if any
    await cancelMedicationReminder(medication.id);

    // Schedule daily notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💊 Time to Take Medicine!',
        body: `${medication.name} - ${medication.dosage}`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 250, 250, 250],
        data: { 
          medicationId: medication.id,
          medicationName: medication.name,
          type: 'medication_reminder'
        },
        categoryIdentifier: 'medication',
      },
      trigger: {
        hour: parseInt(hours),
        minute: parseInt(minutes),
        repeats: true,
      },
    });

    return notificationId;
  } catch (error) {
    console.log('Schedule error:', error);
    return null;
  }
};

// Cancel a specific medication reminder
export const cancelMedicationReminder = async (medicationId) => {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    for (const notification of scheduledNotifications) {
      if (notification.content.data?.medicationId === medicationId) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  } catch (error) {
    console.log('Cancel error:', error);
  }
};

// Cancel all medication reminders
export const cancelAllMedicationReminders = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.log('Cancel all error:', error);
  }
};

// Schedule a snooze notification (10 minutes from now)
export const snoozeNotification = async (medication) => {
  try {
    const snoozeTime = new Date();
    snoozeTime.setMinutes(snoozeTime.getMinutes() + 10);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💊 Snoozed Reminder',
        body: `Time to take ${medication.name} - ${medication.dosage}`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 250, 250, 250],
        data: { 
          medicationId: medication.id,
          medicationName: medication.name,
          type: 'medication_snooze'
        },
        categoryIdentifier: 'medication',
      },
      trigger: snoozeTime,
    });

    return notificationId;
  } catch (error) {
    console.log('Snooze error:', error);
    return null;
  }
};

// Set up notification categories with actions
export const setupNotificationCategories = async () => {
  try {
    await Notifications.setNotificationCategoryAsync('medication', [
      {
        identifier: 'taken',
        buttonTitle: '✓ Mark Taken',
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: 'snooze',
        buttonTitle: '⏰ Snooze 10min',
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: 'dismiss',
        buttonTitle: '✕ Dismiss',
        options: {
          opensAppToForeground: false,
        },
      },
    ]);
  } catch (error) {
    console.log('Category setup error:', error);
  }
};

// Get all scheduled notifications (for debugging)
export const getScheduledNotifications = async () => {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.log('Get notifications error:', error);
    return [];
  }
};