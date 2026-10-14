/**
 * Root layout.
 * Sets up global fonts, metadata, and the persistent navigation header.
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ToastProvider from "@/components/ToastProvider";

// ─── Fonts ───────────────────────────────────────────────────────────────────

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ─── Metadata ────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: "RepoTracker — GitHub Analytics Dashboard",
    template: "%s | RepoTracker",
  },
  description:
    "Search GitHub public repositories, explore details, commits, and contributors, and save your favourites — all in one place.",
  keywords: ["GitHub", "repositories", "analytics", "search", "open source"],
  openGraph: {
    title: "RepoTracker — GitHub Analytics Dashboard",
    description:
      "Explore and bookmark GitHub repositories with a beautiful analytics dashboard.",
    type: "website",
  },
};

// ─── Layout ──────────────────────────────────────────────────────────────────

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Toast notification container */}
        <ToastProvider />

        {/* Persistent top navigation */}
        <Navbar />

        {/* Page content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer
          style={{
            borderTop: "1px solid var(--color-border)",
            padding: "20px 24px",
            textAlign: "center",
            color: "var(--color-text-muted)",
            fontSize: "13px",
          }}
        >
          Built with Next.js · Powered by the{" "}
          <a
            href="https://docs.github.com/en/rest"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--color-accent-start)" }}
          >
            GitHub REST API
          </a>
        </footer>
      </body>
    </html>
  );
}
