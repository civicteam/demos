import { useEffect, useRef, useState } from "react";

interface CivicAuthState {
  isPending: boolean;
  authUrl: string | null;
}

export function useCivicAuth(isStreaming: boolean): CivicAuthState {
  const [isPending, setIsPending] = useState(false);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const openedUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isStreaming) {
      setIsPending(false);
      setAuthUrl(null);
      openedUrlRef.current = null;
      return;
    }

    let cancelled = false;

    const poll = async () => {
      while (!cancelled) {
        try {
          const res = await fetch("/api/civic-auth/pending");
          if (cancelled) break;

          const data = (await res.json()) as { status: string; authUrl?: string };

          if (data.status === "pending" && data.authUrl) {
            setIsPending(true);
            setAuthUrl(data.authUrl);

            if (openedUrlRef.current !== data.authUrl) {
              openedUrlRef.current = data.authUrl;
              window.open(data.authUrl, "_blank");
            }
          } else {
            setIsPending(false);
            setAuthUrl(null);
          }
        } catch {
          // Silently continue polling
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    };

    poll();

    return () => {
      cancelled = true;
    };
  }, [isStreaming]);

  return { isPending, authUrl };
}
