import type { Announcement } from "@/services/announcements";
import { useEffect, useState } from "react";
import { getSystemSettings } from "@/services/system-settings";
import type { SystemSettings } from "@/services/system-settings";
import { FileText, Megaphone } from "lucide-react";

interface AnnouncementsCardProps {
  announcements: Announcement[];
}

export function AnnouncementsCard({ announcements }: AnnouncementsCardProps) {
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(
    null,
  );
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoadingSettings(true);
      try {
        const currentSettings = await getSystemSettings();
        setSystemSettings(currentSettings);
      } catch (error) {
        console.error("Error fetching system settings:", error);
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchSettings();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between pb-2 border-b border-kssem-border">
        <h2 className="font-serif font-bold text-xl text-kssem-text">
          Official Notices
        </h2>
        {announcements.length > 0 && (
          <span className="bg-kssem-gold text-kssem-navy text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
            {announcements.length} New
          </span>
        )}
      </div>
      <div className="bg-white shadow-prestige rounded-sm divide-y divide-kssem-border/50">
        {loadingSettings ? (
          <div className="p-4">
            <p className="text-kssem-text-muted text-sm">
              Loading announcements...
            </p>
          </div>
        ) : announcements.length > 0 ? (
          announcements.slice(0, 3).map((announcement, i) => (
            <div
              key={i}
              className="block p-4 hover:bg-slate-50 transition-colors group cursor-pointer">
              <div className="flex items-start gap-3">
                <div className="bg-kssem-navy/10 text-kssem-navy p-2 rounded-sm shrink-0 group-hover:bg-kssem-navy group-hover:text-white transition-colors">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-kssem-text font-semibold text-sm leading-snug mb-1 group-hover:text-kssem-navy transition-colors">
                    {announcement.title ||
                      systemSettings?.announcementTitle ||
                      "Announcement"}
                  </h4>
                  <p className="text-xs text-kssem-text-muted">
                    {announcement.date} •{" "}
                    {announcement.category || "Administration"}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center">
            <Megaphone className="h-8 w-8 text-kssem-text-muted mx-auto mb-2" />
            <p className="text-kssem-text-muted text-sm">
              {systemSettings?.announcementContent ||
                "No announcements at this time."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
