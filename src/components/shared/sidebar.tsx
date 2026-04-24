"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  Package,
  Wallet,
  Banknote,
  UserCheck,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Nhân viên", href: "/admin/employees", icon: Users },
  { title: "Chấm công", href: "/admin/attendance", icon: Clock },
  { title: "Ca làm việc", href: "/admin/shifts", icon: Calendar },
  { title: "Tồn kho", href: "/admin/inventory", icon: Package },
  { title: "Sổ quỹ", href: "/admin/cashbook", icon: Wallet },
  { title: "Lương", href: "/admin/payroll", icon: Banknote },
  { title: "Khách hàng", href: "/admin/customers", icon: UserCheck },
  { title: "Import tích điểm", href: "/admin/loyalty/import", icon: Star },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-50">
      <div className="flex flex-col flex-grow border-r bg-white pt-5 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-6 mb-8">
          <h1 className="text-xl font-bold text-blue-600">BongShop</h1>
          <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            Admin
          </span>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
