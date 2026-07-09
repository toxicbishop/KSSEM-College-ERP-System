/**
 * Represents a single announcement.
 */
export interface Announcement {
  id: string;
  /**
   * The date the announcement was published.
   */
  date: string;
  /**
   * The title of the announcement.
   */
  title: string;
  /**
   * The main content/body of the announcement.
   */
  content: string;
  /**
   * Optional category (e.g., 'Exams', 'Finance', 'Events').
   */
  category?: string;
  /**
   * Optional author name.
   */
  authorName?: string;
}

/**
 * Asynchronously retrieves recent announcements from the API gateway.
 *
 * The Academic service currently does not expose an announcements endpoint,
 * so this function falls back to mock data.  When the backend implementation
 * is available, replace the fallback with an actual `apiGet` call:
 *
 *   ```
 *   return await apiGet<Announcement[]>('/api/academic/announcements');
 *   ```
 */
export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    // TODO: Replace with real API call once the backend endpoint is available.
    // return await apiGet<Announcement[]>('/api/academic/announcements');
    return [];
  } catch (error) {
    console.error('Failed to fetch announcements:', error);
    return [];
  }
}
