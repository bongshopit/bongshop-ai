"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard, Users, Clock, Calendar, Package, Wallet, Banknote, UserCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 md:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white p-4 md:hidden">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-bold text-blue-600">BongShop</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.title}
                  </Link>
                );
              })}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
