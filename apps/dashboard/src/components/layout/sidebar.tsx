"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/prospects", label: "Prospects" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/emails", label: "Emails" },
  { href: "/leads", label: "Leads" },
  { href: "/actions", label: "Actions" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-sidebar-bg text-sidebar-text flex flex-col">
      <div className="p-6 text-xl font-bold tracking-tight bg-gradient-to-b from-white/5 to-transparent">
        Lead Engine
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-white/10"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <span
                className={`relative z-10 ${isActive ? "text-sidebar-text" : "text-sidebar-text/60 hover:text-sidebar-text/90"}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
