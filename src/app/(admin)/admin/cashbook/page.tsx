import { Metadata } from "next";
import { Prisma } from "@prisma/client";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CashTransactionForm } from "@/components/shared/cash-transaction-form";

export const metadata: Metadata = {
  title: "Sổ quỹ - BongShop",
  description: "Quản lý sổ quỹ thu chi BongShop",
};

interface SearchParams {
  from?: string;
  to?: string;
  type?: string;
}

async function getSummary(from?: Date, to?: Date) {
  const dateFilter: Prisma.CashTransactionWhereInput = {};
  if (from || to) {
    dateFilter.date = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };
  }

  const rows = await prisma.cashTransaction.groupBy({
    by: ["type"],
    _sum: { amount: true },
    where: dateFilter,
  });

  let income = 0;
  let expense = 0;
  for (const r of rows) {
    if (r.type === "INCOME") income = Number(r._sum.amount ?? 0);
    if (r.type === "EXPENSE") expense = Number(r._sum.amount ?? 0);
  }

  return { income, expense, balance: income - expense };
}

async function getTransactions(params: SearchParams) {
  const where: Prisma.CashTransactionWhereInput = {};

  if (params.from || params.to) {
    where.date = {
      ...(params.from ? { gte: new Date(params.from) } : {}),
      ...(params.to
        ? { lte: new Date(new Date(params.to).setHours(23, 59, 59, 999)) }
        : {}),
    };
  }

  if (params.type === "INCOME" || params.type === "EXPENSE") {
    where.type = params.type;
  }

  return prisma.cashTransaction.findMany({
    where,
    orderBy: { date: "desc" },
  });
}

async function getTotalBalance() {
  const rows = await prisma.cashTransaction.groupBy({
    by: ["type"],
    _sum: { amount: true },
  });
  let income = 0;
  let expense = 0;
  for (const r of rows) {
    if (r.type === "INCOME") income = Number(r._sum.amount ?? 0);
    if (r.type === "EXPENSE") expense = Number(r._sum.amount ?? 0);
  }
  return income - expense;
}

function formatCurrency(value: number) {
  return value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(date);
}

export default async function CashbookPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const fromDate = searchParams.from ? new Date(searchParams.from) : undefined;
  const toDate = searchParams.to
    ? new Date(new Date(searchParams.to).setHours(23, 59, 59, 999))
    : undefined;

  const [transactions, summary, totalBalance] = await Promise.all([
    getTransactions(searchParams),
    getSummary(fromDate, toDate),
    getTotalBalance(),
  ]);

  const isFiltered = !!(searchParams.from || searchParams.to || searchParams.type);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Sổ quỹ</h1>

      {/* Summary cards — AC-5.3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-white p-5 flex items-center gap-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Wallet className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Số dư quỹ hiện tại</p>
            <p className={`text-xl font-bold ${totalBalance >= 0 ? "text-gray-900" : "text-red-600"}`}>
              {formatCurrency(totalBalance)}
            </p>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-5 flex items-center gap-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">
              {isFiltered ? "Tổng thu trong kỳ" : "Tổng thu"}
            </p>
            <p className="text-xl font-bold text-green-700">{formatCurrency(summary.income)}</p>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-5 flex items-center gap-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <TrendingDown className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">
              {isFiltered ? "Tổng chi trong kỳ" : "Tổng chi"}
            </p>
            <p className="text-xl font-bold text-red-700">{formatCurrency(summary.expense)}</p>
          </div>
        </div>
      </div>

      {/* AC-5.4 — báo cáo tổng kết kỳ (hiện khi có filter thời gian) */}
      {isFiltered && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          <span className="font-medium">Báo cáo kỳ lọc:</span> Thu{" "}
          <span className="font-bold">{formatCurrency(summary.income)}</span> — Chi{" "}
          <span className="font-bold">{formatCurrency(summary.expense)}</span> — Số dư cuối kỳ{" "}
          <span className="font-bold">{formatCurrency(summary.balance)}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form tạo phiếu — AC-5.1 */}
        <div className="lg:col-span-1">
          <CashTransactionForm />
        </div>

        {/* Danh sách giao dịch — AC-5.2 */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter form */}
          <form method="GET" className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <label className="block text-xs text-gray-500">Từ ngày</label>
              <input
                name="from"
                type="date"
                defaultValue={searchParams.from ?? ""}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs text-gray-500">Đến ngày</label>
              <input
                name="to"
                type="date"
                defaultValue={searchParams.to ?? ""}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs text-gray-500">Loại</label>
              <select
                name="type"
                defaultValue={searchParams.type ?? ""}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả</option>
                <option value="INCOME">Thu</option>
                <option value="EXPENSE">Chi</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-gray-800 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
            >
              Lọc
            </button>
            {isFiltered && (
              <a
                href="/admin/cashbook"
                className="px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-md hover:bg-gray-50 transition-colors"
              >
                Xóa lọc
              </a>
            )}
          </form>

          {/* Transaction table */}
          <div className="rounded-lg border bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 font-medium">Ngày</th>
                    <th className="px-4 py-3 font-medium">Loại</th>
                    <th className="px-4 py-3 font-medium">Mô tả</th>
                    <th className="px-4 py-3 font-medium">Danh mục</th>
                    <th className="px-4 py-3 font-medium text-right">Số tiền</th>
                    <th className="px-4 py-3 font-medium">Người tạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                        Không có giao dịch nào
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {formatDate(tx.date)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              tx.type === "INCOME"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {tx.type === "INCOME" ? "Thu" : "Chi"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-900 max-w-[200px] truncate">
                          {tx.description}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{tx.category ?? "—"}</td>
                        <td
                          className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${
                            tx.type === "INCOME" ? "text-green-700" : "text-red-700"
                          }`}
                        >
                          {tx.type === "INCOME" ? "+" : "-"}
                          {formatCurrency(Number(tx.amount))}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{tx.createdBy}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
