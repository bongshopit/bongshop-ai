import { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { ShiftsManager } from "@/components/shared/shifts-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ca làm việc - BongShop",
  description: "Quản lý ca làm việc BongShop",
};

interface SearchParams {
  date?: string;
}

async function ShiftsContent({ searchParams }: { searchParams: SearchParams }) {
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
      take: 200,
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
    <ShiftsManager
      shifts={shifts}
      assignments={assignments}
      employees={employees}
      currentDate={dateStr}
    />
  );
}

function ShiftsContentSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <div className="h-9 w-44 bg-gray-200 rounded animate-pulse" />
        <div className="h-9 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-lg border bg-white overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 flex justify-between items-center">
              <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="p-4 space-y-3">
              {[0, 1, 2].map((j) => (
                <div key={j} className="h-10 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ShiftsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ca làm việc</h1>
      <Suspense fallback={<ShiftsContentSkeleton />}>
        <ShiftsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

