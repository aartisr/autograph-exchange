import type { Metadata } from "next";
import React from "react";
import "./globals.css";
import "@autograph-exchange/feature/styles.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Autograph Exchange",
  description: "A standalone, reusable autograph exchange experience.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
