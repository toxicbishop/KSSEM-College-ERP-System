import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/client";

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8080";

/** Shared authenticated fetch/SSE pattern used by generated and live data streams. */
export function useGenerateStream<T>(path: string | null) {
  const [event, setEvent] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();

    void (async () => {
      try {
        const token = await auth?.currentUser?.getIdToken();
        if (!token) throw new Error("User not authenticated");
        const response = await fetch(`${GATEWAY_URL}${path}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok || !response.body) {
          throw new Error(`Stream request failed (${response.status})`);
        }
        setIsStreaming(true);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";
          for (const frame of frames) {
            const data = frame.split("\n").filter((line) => line.startsWith("data:"))
              .map((line) => line.slice(5).trim()).join("\n");
            if (data) setEvent(JSON.parse(data) as T);
          }
        }
      } catch (streamError) {
        if (!controller.signal.aborted) setError(streamError as Error);
      } finally {
        if (!controller.signal.aborted) setIsStreaming(false);
      }
    })();

    return () => controller.abort();
  }, [path]);

  return { event, error, isStreaming };
}
