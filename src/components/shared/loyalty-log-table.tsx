import { prisma } from "@/lib/prisma";
import { CATEGORY_LABELS, type LoyaltyCategory } from "@/lib/validators/loyalty";

const TYPE_LABELS: Record<string, string> = {
  EARN: "Cộng điểm",
  ADJUST: "Điều chỉnh",
  EXPIRE: "Hết hạn",
  REDEEM: "Đổi điểm",
};

const CATEGORY_COLORS: Record<LoyaltyCategory, string> = {
  DEFAULT: "bg-gray-100 text-gray-700",
  SUA: "bg-blue-100 text-blue-700",
  TA_BIM: "bg-purple-100 text-purple-700",
};

export async function LoyaltyLogTable({ customerId }: { customerId: string }) {
  const logs = await prisma.loyaltyLog.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (logs.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-4 text-center">
        Chưa có lịch sử điểm
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-gray-500 text-xs">
            <th className="pb-2 text-left font-medium">Ngày</th>
            <th className="pb-2 text-left font-medium">Danh mục</th>
            <th className="pb-2 text-left font-medium">Loại</th>
            <th className="pb-2 text-right font-medium">Điểm</th>
            <th className="pb-2 text-left font-medium pl-4">Lý do</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {logs.map((log) => {
            const cat = log.loyaltyCategory as LoyaltyCategory;
            return (
              <tr key={log.id}>
                <td className="py-2 text-gray-500 whitespace-nowrap text-xs">
                  {new Date(log.createdAt).toLocaleDateString("vi-VN")}
                </td>
                <td className="py-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      CATEGORY_COLORS[cat] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {CATEGORY_LABELS[cat] ?? cat}
                  </span>
                </td>
                <td className="py-2 text-gray-600 text-xs">
                  {TYPE_LABELS[log.type] ?? log.type}
                </td>
                <td
                  className={`py-2 text-right font-semibold text-sm ${
                    log.points >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {log.points >= 0 ? "+" : ""}
                  {log.points}
                </td>
                <td className="py-2 text-gray-500 pl-4 max-w-[180px] truncate text-xs">
                  {log.reason ?? "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
