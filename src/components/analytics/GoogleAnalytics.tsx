
// src/components/analytics/GoogleAnalytics.tsx
'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { useEffect } from 'react';
import { pageview, GA_TRACKING_ID } from '@/lib/gtag';

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_TRACKING_ID || typeof window.gtag !== 'function') {
      return;
    }

    const pathWithSearch = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    pageview(pathWithSearch);

  }, [pathname, searchParams]);

  if (!GA_TRACKING_ID) {
    // Optionally log that GA is not configured, or just render nothing.
    // console.warn("Google Analytics Measurement ID (NEXT_PUBLIC_GA_MEASUREMENT_ID) is not set. Tracking is disabled.");
    return null;
  }
  // Whitelist simple GA measurement ID formats to avoid injection
  const sanitizeGid = (gid: string) => {
    const s = String(gid).trim()
    // Accept UA-*, G-*, or GA4-like IDs (alphanumeric, dashes, underscores)
    if (/^(G|UA|MEASUREMENT)\-[A-Z0-9\-_]+$/i.test(s) || /^G\-[A-Z0-9\-_]+$/i.test(s)) {
      return s
    }
    return null
  }

  const safeId = sanitizeGid(GA_TRACKING_ID)
  if (!safeId) return null

  const inline = `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${safeId}', {page_path: window.location.pathname + window.location.search});`

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(safeId)}`}
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {inline}
      </Script>
    </>
  )
}
