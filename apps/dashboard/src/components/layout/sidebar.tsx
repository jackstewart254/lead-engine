import Link from "next/link";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/prospects", label: "Prospects" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/emails", label: "Emails" },
  { href: "/leads", label: "Leads" },
  { href: "/actions", label: "Actions" },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-sidebar-bg text-sidebar-text flex flex-col">
      <div className="p-6 text-xl font-bold tracking-tight">Lead Engine</div>
      <nav className="flex-1 px-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-text/70 transition-colors hover:bg-white/10 hover:text-sidebar-text"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
