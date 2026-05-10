import { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Clock,
  Package,
  UserCheck,
  Wallet,
  Archive,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { StatsSkeletonGrid } from "@/components/shared/table-skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard - BongShop",
  description: "Tổng quan hệ thống quản lý BongShop",
};

// ===================== STATS =====================

async function getStats() {
  const today = new Date(new Date().toISOString().split("T")[0]);
  const [
    employeeCount,
    productCount,
    customerCount,
    todayAttendance,
    incomeAgg,
    expenseAgg,
    openStorages,
  ] = await Promise.all([
    prisma.employee.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.customer.count(),
    prisma.attendance.count({ where: { date: { gte: today } } }),
    prisma.cashTransaction.aggregate({
      _sum: { amount: true },
      where: { type: "INCOME" },
    }),
    prisma.cashTransaction.aggregate({
      _sum: { amount: true },
      where: { type: "EXPENSE" },
    }),
    prisma.customerStorage.count({ where: { status: "OPEN" } }),
  ]);

  const cashBalance =
    Number(incomeAgg._sum.amount ?? 0) - Number(expenseAgg._sum.amount ?? 0);

  return {
    employeeCount,
    productCount,
    customerCount,
    todayAttendance,
    cashBalance,
    openStorages,
  };
}

async function DashboardStats() {
  const stats = await getStats();

  const cards = [
    {
      title: "Nhân viên",
      value: stats.employeeCount.toString(),
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      href: "/admin/employees",
      valueClass: "text-3xl font-bold text-gray-900",
    },
    {
      title: "Chấm công hôm nay",
      value: stats.todayAttendance.toString(),
      icon: Clock,
      color: "text-green-600",
      bg: "bg-green-50",
      href: "/admin/attendance",
      valueClass: "text-3xl font-bold text-gray-900",
    },
    {
      title: "Sản phẩm",
      value: stats.productCount.toString(),
      icon: Package,
      color: "text-orange-600",
      bg: "bg-orange-50",
      href: "/admin/inventory",
      valueClass: "text-3xl font-bold text-gray-900",
    },
    {
      title: "Khách hàng",
      value: stats.customerCount.toString(),
      icon: UserCheck,
      color: "text-purple-600",
      bg: "bg-purple-50",
      href: "/admin/customers",
      valueClass: "text-3xl font-bold text-gray-900",
    },
    {
      title: "Số dư quỹ",
      value: formatCurrency(stats.cashBalance),
      icon: Wallet,
      color: stats.cashBalance >= 0 ? "text-emerald-600" : "text-red-600",
      bg: stats.cashBalance >= 0 ? "bg-emerald-50" : "bg-red-50",
      href: "/admin/cashbook",
      valueClass: cn(
        "text-lg font-bold",
        stats.cashBalance >= 0 ? "text-emerald-600" : "text-red-600"
      ),
    },
    {
      title: "Gửi hàng đang mở",
      value: stats.openStorages.toString(),
      icon: Archive,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      href: "/admin/customers",
      valueClass: "text-3xl font-bold text-gray-900",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <Link key={card.title} href={card.href}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-gray-600 leading-tight">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bg} shrink-0`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className={card.valueClass}>{card.value}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

// ===================== LOW STOCK =====================

async function LowStockSection() {
  const lowStockProducts = await prisma.product.findMany({
    where: { quantity: { lte: 10 }, isActive: true },
    orderBy: { quantity: "asc" },
    take: 5,
    select: { id: true, name: true, sku: true, quantity: true, unit: true },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          Sản phẩm sắp hết hàng
        </CardTitle>
        <Link
          href="/admin/inventory"
          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
        >
          Xem tất cả <ChevronRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {lowStockProducts.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">
            ✓ Tất cả sản phẩm còn đủ hàng
          </p>
        ) : (
          <div className="space-y-2">
            {lowStockProducts.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between py-1.5 border-b last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {p.name}
                  </p>
                  <p className="text-xs text-gray-500">{p.sku}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 ml-2 text-xs font-semibold px-2 py-0.5 rounded-full",
                    p.quantity === 0
                      ? "bg-red-100 text-red-700"
                      : p.quantity <= 5
                      ? "bg-orange-100 text-orange-700"
                      : "bg-yellow-100 text-yellow-700"
                  )}
                >
                  {p.quantity} {p.unit}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ===================== RECENT TRANSACTIONS =====================

async function RecentTransactionsSection() {
  const transactions = await prisma.cashTransaction.findMany({
    orderBy: { date: "desc" },
    take: 5,
    select: {
      id: true,
      type: true,
      amount: true,
      description: true,
      date: true,
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Wallet className="h-4 w-4 text-blue-500" />
          Giao dịch gần nhất
        </CardTitle>
        <Link
          href="/admin/cashbook"
          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
        >
          Xem tất cả <ChevronRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">
            Chưa có giao dịch nào
          </p>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-1.5 border-b last:border-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {tx.type === "INCOME" ? (
                    <ArrowDownLeft className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-red-500 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900 truncate">
                      {tx.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(tx.date)}
                    </p>
                  </div>
                </div>
                <p
                  className={cn(
                    "text-sm font-semibold shrink-0 ml-2",
                    tx.type === "INCOME" ? "text-green-600" : "text-red-600"
                  )}
                >
                  {tx.type === "INCOME" ? "+" : "-"}
                  {formatCurrency(Number(tx.amount))}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ===================== ABSENT EMPLOYEES =====================

async function AbsentEmployeesSection() {
  const today = new Date(new Date().toISOString().split("T")[0]);
  const [allEmployees, presentRecords] = await Promise.all([
    prisma.employee.findMany({
      where: { isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        position: true,
      },
    }),
    prisma.attendance.findMany({
      where: { date: { gte: today } },
      select: { employeeId: true },
    }),
  ]);

  const presentIds = new Set(presentRecords.map((r) => r.employeeId));
  const absentEmployees = allEmployees.filter((e) => !presentIds.has(e.id));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-yellow-500" />
          Chưa chấm công hôm nay
          {absentEmployees.length > 0 && (
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
              {absentEmployees.length}
            </span>
          )}
        </CardTitle>
        <Link
          href="/admin/attendance"
          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
        >
          Xem tất cả <ChevronRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {absentEmployees.length === 0 ? (
          <p className="text-sm text-green-600 py-4 text-center flex items-center justify-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            Tất cả nhân viên đã chấm công hôm nay
          </p>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {absentEmployees.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-2 py-1.5 border-b last:border-0"
              >
                <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-medium text-gray-600">
                    {e.firstName[0]}
                    {e.lastName[0]}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {e.firstName} {e.lastName}
                  </p>
                  {e.position && (
                    <p className="text-xs text-gray-500 truncate">
                      {e.position}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ===================== SKELETON =====================

function SectionSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-3">
        <div className="h-4 w-40 bg-gray-200 rounded" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="h-4 bg-gray-100 rounded w-48" />
              <div className="h-4 bg-gray-100 rounded w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ===================== PAGE =====================

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* 6 Stat Cards */}
      <Suspense fallback={<StatsSkeletonGrid count={6} />}>
        <DashboardStats />
      </Suspense>

      {/* Info Sections */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Suspense fallback={<SectionSkeleton />}>
          <LowStockSection />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <RecentTransactionsSection />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <AbsentEmployeesSection />
        </Suspense>
      </div>
    </div>
  );
}
