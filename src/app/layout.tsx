import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Textify to Spotify — Import Songs from Text",
  description:
    "Paste any song list as raw text, match tracks on Spotify, and create a playlist in seconds. Supports markdown, numbered lists, CSV, and more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
