import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AttendanceCheckinPanel } from "@/components/shared/attendance-checkin-panel";

export const metadata: Metadata = {
  title: "Chấm công - BongShop",
  description: "Quản lý chấm công BongShop",
};

interface SearchParams {
  date?: string;
  month?: string;
  employeeId?: string;
}

async function getAttendances(params: SearchParams) {
  const where: Record<string, unknown> = {};

  if (params.date) {
    const d = new Date(params.date);
    d.setHours(0, 0, 0, 0);
    where.date = d;
  } else if (params.month) {
    const [year, month] = params.month.split("-").map(Number);
    where.date = {
      gte: new Date(year, month - 1, 1),
      lt: new Date(year, month, 1),
    };
  } else {
    // Mặc định: tháng hiện tại
    const now = new Date();
    where.date = {
      gte: new Date(now.getFullYear(), now.getMonth(), 1),
      lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    };
  }

  if (params.employeeId) {
    where.employeeId = params.employeeId;
  }

  return prisma.attendance.findMany({
    where,
    include: {
      employee: {
        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          lastName: true,
          department: true,
        },
      },
    },
    orderBy: [{ date: "desc" }, { checkIn: "asc" }],
  });
}

function formatTime(date: Date | null) {
  if (!date) return "—";
  return new Date(date).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getServerSession(authOptions);

  // Tìm employee của user đang đăng nhập
  const currentEmployee = session?.user?.id
    ? await prisma.employee.findFirst({
        where: { user: { id: session.user.id } },
      })
    : null;

  // Lấy trạng thái chấm công hôm nay
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayAttendance = currentEmployee
    ? await prisma.attendance.findUnique({
        where: {
          employeeId_date: {
            employeeId: currentEmployee.id,
            date: today,
          },
        },
      })
    : null;

  // Lấy danh sách chấm công
  const [attendances, employees] = await Promise.all([
    getAttendances(searchParams),
    prisma.employee.findMany({
      where: { isActive: true },
      select: { id: true, firstName: true, lastName: true, employeeCode: true },
      orderBy: { employeeCode: "asc" },
    }),
  ]);

  const currentMonth =
    searchParams.month ||
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Chấm công</h1>

      {/* Panel check-in/out */}
      <AttendanceCheckinPanel
        todayAttendance={
          todayAttendance
            ? {
                checkIn: todayAttendance.checkIn,
                checkOut: todayAttendance.checkOut,
                totalHours: todayAttendance.totalHours
                  ? Number(todayAttendance.totalHours)
                  : null,
              }
            : null
        }
        hasEmployee={!!currentEmployee}
      />

      {/* Bộ lọc */}
      <form method="GET" className="flex flex-wrap gap-3 mb-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Tháng</label>
          <input
            type="month"
            name="month"
            defaultValue={currentMonth}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Ngày cụ thể</label>
          <input
            type="date"
            name="date"
            defaultValue={searchParams.date || ""}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Nhân viên</label>
          <select
            name="employeeId"
            defaultValue={searchParams.employeeId || ""}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            <option value="">Tất cả</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.employeeCode} — {emp.lastName} {emp.firstName}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          >
            Lọc
          </button>
        </div>
      </form>

      {/* Bảng chấm công */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Ngày</th>
                <th className="px-4 py-3 font-medium">Mã NV</th>
                <th className="px-4 py-3 font-medium">Họ tên</th>
                <th className="px-4 py-3 font-medium">Phòng ban</th>
                <th className="px-4 py-3 font-medium">Giờ vào</th>
                <th className="px-4 py-3 font-medium">Giờ ra</th>
                <th className="px-4 py-3 font-medium">Tổng giờ</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attendances.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-gray-400"
                  >
                    Không có dữ liệu chấm công
                  </td>
                </tr>
              ) : (
                attendances.map((att) => {
                  const done = !!att.checkOut;
                  const working = !!att.checkIn && !att.checkOut;
                  return (
                    <tr key={att.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700">
                        {formatDate(att.date)}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {att.employee.employeeCode}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {att.employee.lastName} {att.employee.firstName}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {att.employee.department || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {formatTime(att.checkIn)}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {formatTime(att.checkOut)}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {att.totalHours
                          ? `${Number(att.totalHours).toFixed(2)}h`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            done
                              ? "bg-green-100 text-green-700"
                              : working
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {done
                            ? "Đã hoàn thành"
                            : working
                            ? "Đang làm"
                            : "Vắng"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-500">
          Tổng: {attendances.length} bản ghi
        </div>
      </div>
    </div>
  );
}

