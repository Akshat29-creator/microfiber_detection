import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

export const metadata: Metadata = {
  title: "Microplastic Detection Dashboard | DSA Project",
  description: "Real-time ESP32 microplastic detection system with animated DSA visualizations",
  other: {
    'darkreader-lock': 'true',
    'color-scheme': 'dark',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="darkreader-lock" content="true" />
        <meta name="color-scheme" content="dark" />
      </head>
      <body suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
