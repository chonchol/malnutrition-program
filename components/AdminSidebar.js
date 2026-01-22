"use client";

import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  Plus,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/charts", label: "Analytics", icon: TrendingUp },
  { href: "/patients/new", label: "New assessment", icon: Plus },
];

export default function AdminSidebar({ collapsed, onLogout }) {
  const pathname = usePathname();

  return (
    <aside
      className={`glass fixed left-0 top-0 h-screen flex flex-col transition-all duration-200 overflow-y-auto z-10 ${collapsed ? "w-20" : "w-64"
        }`}
    >
      <div className="border-b border-slate-200 p-4 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-sky-500 to-emerald-400 text-sm font-bold text-white">
            <span>H</span>
          </div>
          {!collapsed && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-500">
                HAEFA
              </p>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Dashboard
              </h2>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + "/");
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${active
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100"
                : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}
              title={collapsed ? link.label : undefined}
            >
              <Icon size={20} className="shrink-0" />
              {!collapsed && <span className="truncate">{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4 dark:border-slate-700">
        {onLogout && (
          <button
            onClick={onLogout}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-red-50 dark:text-slate-200 dark:hover:bg-red-900/20 ${collapsed ? "justify-center" : ""
              }`}
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut size={20} className="shrink-0" />
            {!collapsed && <span className="truncate">Logout</span>}
          </button>
        )}
      </div>
    </aside>
  );
}
