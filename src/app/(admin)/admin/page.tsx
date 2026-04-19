import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Clock, Package, UserCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard - BongShop",
  description: "Tổng quan hệ thống quản lý BongShop",
};

async function getStats() {
  const [employeeCount, productCount, customerCount, todayAttendance] =
    await Promise.all([
      prisma.employee.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.customer.count(),
      prisma.attendance.count({
        where: {
          date: {
            gte: new Date(new Date().toISOString().split("T")[0]),
          },
        },
      }),
    ]);

  return { employeeCount, productCount, customerCount, todayAttendance };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const cards = [
    {
      title: "Nhân viên",
      value: stats.employeeCount,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Chấm công hôm nay",
      value: stats.todayAttendance,
      icon: Clock,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Sản phẩm",
      value: stats.productCount,
      icon: Package,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      title: "Khách hàng",
      value: stats.customerCount,
      icon: UserCheck,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
