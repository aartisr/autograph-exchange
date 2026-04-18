"use client";

import { AutographExchangeFeature } from "../../AutographExchangeFeature";

async function hostFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/hosted-autographs${input}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
      "X-Host-Application": "example-consumer",
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export default function CustomFetcherAutographFeatureExample() {
  return (
    <AutographExchangeFeature
      authStatus="authenticated"
      viewer={{
        id: "custom-fetch-user",
        name: "Custom Fetch Host",
        email: "custom@example.com",
      }}
      api={{
        fetcher: hostFetch,
      }}
      onEvent={(event) => {
        console.info("custom-fetch autograph telemetry", event);
      }}
    />
  );
}
