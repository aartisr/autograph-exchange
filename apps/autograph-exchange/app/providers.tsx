"use client";

import React, { useEffect, useRef } from "react";
import { SessionProvider } from "next-auth/react";

const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim();

export function Providers({ children }: { children: React.ReactNode }) {
  const hasInitializedClarity = useRef(false);

  useEffect(() => {
    if (!clarityProjectId || hasInitializedClarity.current) {
      return;
    }

    hasInitializedClarity.current = true;

    const scriptId = `ms-clarity-${clarityProjectId}`;
    if (document.getElementById(scriptId)) {
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.src = `https://www.clarity.ms/tag/${encodeURIComponent(clarityProjectId)}`;
    script.onerror = () => {
      hasInitializedClarity.current = false;
    };
    document.head.appendChild(script);
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}
