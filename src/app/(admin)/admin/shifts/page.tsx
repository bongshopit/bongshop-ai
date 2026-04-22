import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ShiftsManager } from "@/components/shared/shifts-manager";

export const metadata: Metadata = {
  title: "Ca lam viec - BongShop",
  description: "Quan ly ca lam viec BongShop",
};

interface SearchParams {
  date?: string;
}

export default async function ShiftsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const today = new Date().toISOString().split("T")[0];
  const dateStr = searchParams.date || today;
  const dateFilter = new Date(dateStr + "T00:00:00.000Z");

  const [shifts, assignments, employees] = await Promise.all([
    prisma.shift.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: { _count: { select: { assignments: true } } },
    }),
    prisma.shiftAssignment.findMany({
      where: { date: dateFilter },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
        shift: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.employee.findMany({
      where: { isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeCode: true,
      },
      orderBy: { employeeCode: "asc" },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ca làm việc</h1>
      <ShiftsManager
        shifts={shifts}
        assignments={assignments}
        employees={employees}
        currentDate={dateStr}
      />
    </div>
  );
}
