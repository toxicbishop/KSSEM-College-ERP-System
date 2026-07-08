// src/services/system-settings.ts
import { apiGet, apiPatch } from "@/lib/api-client";

export interface SystemSettings {
  maintenanceMode: boolean;
  allowNewUserRegistration: boolean;
  applicationName: string;
  announcementTitle: string;
  announcementContent: string;
  defaultItemsPerPage: number;
  lastUpdated?: Date | null;
}

export const defaultSettings: SystemSettings = {
  maintenanceMode: false,
  allowNewUserRegistration: true,
  applicationName: "K.S School of Engineering & Management",
  announcementTitle: "Welcome to K.S School of Engineering & Management!",
  announcementContent:
    "Stay tuned for important updates and announcements. You can customize this message in the admin settings.",
  defaultItemsPerPage: 10,
  lastUpdated: null,
};

/**
 * Asynchronously retrieves the current system settings.
 *
 * @returns A promise that resolves to a SystemSettings object.
 */
export async function getSystemSettings(): Promise<SystemSettings> {
  const onServer = typeof window === "undefined";
  const isEdgeEnvironment =
    onServer && typeof (globalThis as any).EdgeRuntime === "string";

  if (isEdgeEnvironment) {
    return { ...defaultSettings, lastUpdated: new Date() };
  }

  try {
    const data = await apiGet<SystemSettings>("/api/admin/settings");
    return {
      ...defaultSettings,
      ...data,
    };
  } catch (error) {
    console.error("Failed to fetch system settings from API", error);
    return { ...defaultSettings };
  }
}

/**
 * Asynchronously updates specified system settings.
 */
export async function updateSystemSettings(
  settingsToUpdate: Partial<SystemSettings>,
): Promise<void> {
  try {
    await apiPatch("/api/admin/settings", { settings: settingsToUpdate });
  } catch (error) {
    console.error("Failed to update system settings via API", error);
    throw new Error("Failed to update system settings.");
  }
}
