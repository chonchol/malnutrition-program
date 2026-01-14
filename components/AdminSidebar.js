"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/patients/new", label: "New assessment" },
];

export default function AdminSidebar({ collapsed }) {
  const pathname = usePathname();
  return (
    <aside
      className={`glass sticky top-4 h-fit rounded-3xl p-4 transition-all duration-200 ${
        collapsed ? "w-16" : "w-full max-w-xs"
      }`}
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-400 text-xs font-semibold text-white">
          AD
        </div>
        {!collapsed && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-500">
              Admin panel
            </p>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Control center
            </h2>
          </div>
        )}
      </div>
      <nav className="space-y-1">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center justify-between rounded-2xl px-3 py-2 text-xs font-semibold ${
                active
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              <span className="truncate">{collapsed ? link.label[0] : link.label}</span>
              {!collapsed && active && <span className="text-[10px]">●</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
