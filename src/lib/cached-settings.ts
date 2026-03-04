import { cache } from "react";
import { unstable_cache } from "next/cache";
import { adminDb } from "@/lib/firebase/admin.server";
import { SystemSettings } from "@/services/system-settings";

const DEFAULT_APP_NAME = "K.S. School of Engineering and Management";

/**
 * Fetches system settings from Firestore using the Admin SDK.
 * This function is used exclusively on the server (Node.js runtime).
 */
const fetchSystemSettings = async (): Promise<Partial<SystemSettings>> => {
  console.log("[CachedSettings] Fetching from Firestore...");

  if (!adminDb) {
    console.warn("[CachedSettings] Admin DB not initialized.");
    return {};
  }

  try {
    const settingsDocRef = adminDb
      .collection("systemSettings")
      .doc("appConfiguration");
    const docSnap = await settingsDocRef.get();

    if (docSnap.exists) {
      return docSnap.data() as Partial<SystemSettings>;
    }
  } catch (error) {
    console.error("[CachedSettings] Error fetching settings:", error);
  }

  return {};
};

/**
 * Caches the system settings fetch across multiple requests.
 * Revalidates every 1 hour (3600 seconds).
 */
export const getCachedSystemSettings = unstable_cache(
  async () => fetchSystemSettings(),
  ["system-settings"],
  {
    revalidate: 3600, // 1 hour
    tags: ["settings"],
  },
);

/**
 * Memoizes the settings fetch within a single request lifecycle.
 * Prevents multiple DB calls if getCachedSystemSettings is called multiple times
 * in a single page render (e.g., once for metadata, once for layout).
 */
export const getRequestMemoizedSettings = cache(async () => {
  return getCachedSystemSettings();
});

export const getApplicationName = async () => {
  const settings = await getRequestMemoizedSettings();
  return settings.applicationName || DEFAULT_APP_NAME;
};
