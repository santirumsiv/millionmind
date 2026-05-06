import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { supabase } from "./supabase";

/**
 * Register for push notifications and persist the Expo token to the
 * user's profile. Pro-only feature, but registration works for any
 * tier — the server filters at send time.
 *
 * Returns the token on success, null if the user denied permission or
 * we're running on a simulator (where push doesn't work).
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log("[push] Skipping registration on simulator/emulator");
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    return null;
  }

  // On Android we need a notification channel before tokens are usable.
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Drawing reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (!projectId) {
    console.warn("[push] No EAS projectId — set it via `eas init`");
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

  // Persist on the user's profile.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return token;

  await supabase
    .from("profiles")
    .update({
      push_token: token,
      push_platform: Platform.OS === "ios" ? "ios" : "android",
    })
    .eq("id", user.id);

  return token;
}

/** Toggle the per-user notifications_enabled flag on the profile. */
export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("profiles")
    .update({ notifications_enabled: enabled })
    .eq("id", user.id);
}

/** Default Expo notification handler — show the alert + play sound. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
