// src/components/analytics/GoogleAnalytics.tsx
import { useLocation, useSearchParams } from "react-router-dom";
import { useEffect } from 'react';
import { pageview, GA_TRACKING_ID } from '@/lib/gtag';

export default function GoogleAnalytics() {
  const pathname = useLocation().pathname;
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!GA_TRACKING_ID || typeof window.gtag !== 'function') {
      return;
    }
    
    let url = pathname;
    if (searchParams.toString()) {
      url += `?${searchParams.toString()}`;
    }
    
    pageview(url);
  }, [pathname, searchParams]);

  if (!GA_TRACKING_ID) {
    return null;
  }

  const sanitizeGid = (gid: string) => {
    const s = String(gid).trim();
    if (/^(G|UA|MEASUREMENT)\-[A-Z0-9\-_]+$/i.test(s) || /^G\-[A-Z0-9\-_]+$/i.test(s)) {
      return s;
    }
    return null;
  };

  const safeId = sanitizeGid(GA_TRACKING_ID);
  if (!safeId) return null;

  return (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(safeId)}`}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${safeId}', {
              page_path: window.location.pathname + window.location.search
            });
          `,
        }}
      />
    </>
  );
}
