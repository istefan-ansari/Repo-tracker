"use client";

/**
 * Top navigation bar.
 * Highlights the active link using the Next.js `usePathname` hook.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Search", icon: "🔍" },
  { href: "/saved", label: "Saved", icon: "⭐" },
] as const;

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header
      style={{
        background: "rgba(13, 17, 23, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--color-border)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <nav
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          <span
            style={{
              background:
                "linear-gradient(135deg, var(--color-accent-start), var(--color-accent-end))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            RepoTracker
          </span>
        </Link>

        {/* Navigation links */}
        <ul
          style={{
            display: "flex",
            listStyle: "none",
            gap: 4,
            alignItems: "center",
          }}
        >
          {NAV_LINKS.map(({ href, label, icon }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 14px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive
                      ? "var(--color-text-primary)"
                      : "var(--color-text-secondary)",
                    background: isActive
                      ? "var(--color-bg-tertiary)"
                      : "transparent",
                    border: isActive
                      ? "1px solid var(--color-border)"
                      : "1px solid transparent",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  <span>{icon}</span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
