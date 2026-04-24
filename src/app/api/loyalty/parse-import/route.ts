import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as xlsx from "xlsx";
import type { ParsePreviewResponse, CustomerPreviewRow } from "@/lib/validators/loyalty";

function normalizePhone(raw: unknown): string | null {
  if (raw == null) return null;
  const cleaned = String(raw).trim().replace(/\s+/g, "").replace(/^\+84/, "0");
  if (/^[0-9]{10,11}$/.test(cleaned)) return cleaned;
  return null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    (session.user.role !== "MANAGER" && session.user.role !== "ADMIN")
  ) {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Không thể đọc form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Không có file" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File quá lớn (tối đa 5MB)" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let workbook: xlsx.WorkBook;
  try {
    workbook = xlsx.read(buffer, { type: "buffer" });
  } catch {
    return NextResponse.json(
      { error: "Không thể đọc file xlsx" },
      { status: 400 }
    );
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return NextResponse.json(
      { error: "File không có sheet dữ liệu" },
      { status: 400 }
    );
  }

  const sheet = workbook.Sheets[sheetName];
  const rawData = xlsx.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
  });

  if (rawData.length < 2) {
    return NextResponse.json(
      { error: "File không có dữ liệu" },
      { status: 400 }
    );
  }

  // ─── Parse rows ────────────────────────────────────────────────────────────
  type RawItem = {
    invoiceId: string;
    phone: string;
    customerName: string;
    sku: string;
    amount: number;
  };

  const items: RawItem[] = [];
  let noPhoneCount = 0;

  // Column indices (0-based) from file analysis:
  // 1=Mã hóa đơn, 12=Tên KH, 14=Điện thoại, 49=Trạng thái, 51=Mã hàng, 64=Thành tiền
  const COL_INVOICE = 1;
  const COL_CUST_NAME = 12;
  const COL_PHONE = 14;
  const COL_STATUS = 49;
  const COL_SKU = 51;
  const COL_AMOUNT = 64;

  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length < COL_AMOUNT + 1) continue;

    const status = String(row[COL_STATUS] ?? "").trim();
    if (status !== "Hoàn thành") continue;

    const amount = Number(row[COL_AMOUNT] ?? 0);
    if (amount <= 0) continue;

    const phone = normalizePhone(row[COL_PHONE]);
    if (!phone) {
      noPhoneCount++;
      continue;
    }

    items.push({
      invoiceId: String(row[COL_INVOICE] ?? "").trim(),
      phone,
      customerName: String(row[COL_CUST_NAME] ?? "").trim(),
      sku: String(row[COL_SKU] ?? "").trim(),
      amount,
    });
  }

  if (items.length === 0) {
    const emptyResp: ParsePreviewResponse = {
      rows: [],
      stats: {
        totalInvoices: 0,
        matchedCustomers: 0,
        unmatchedCustomers: 0,
        noPhoneRows: noPhoneCount,
        totalPoints: 0,
      },
      duplicateInvoices: [],
    };
    return NextResponse.json(emptyResp);
  }

  // ─── DB lookups ────────────────────────────────────────────────────────────
  const uniquePhones = Array.from(new Set(items.map((i) => i.phone)));
  const uniqueSkus = Array.from(new Set(items.map((i) => i.sku).filter(Boolean)));
  const allInvoiceIds = Array.from(new Set(items.map((i) => i.invoiceId).filter(Boolean)));

  const [customers, products, existingLogs] = await Promise.all([
    prisma.customer.findMany({
      where: { phone: { in: uniquePhones } },
      select: { id: true, name: true, phone: true },
    }),
    prisma.product.findMany({
      where: { sku: { in: uniqueSkus } },
      select: {
        sku: true,
        allowLoyalty: true,
        productGroup: { select: { loyaltyCategory: true } },
      },
    }),
    prisma.loyaltyLog.findMany({
      where: { reason: { contains: "Import KiotViet" } },
      select: { reason: true },
    }),
  ]);

  const customerMap = new Map(
    customers.map((c) => [c.phone!, c] as [string, (typeof customers)[number]])
  );
  const productMap = new Map(products.map((p) => [p.sku, p]));

  // ─── Dedup check ───────────────────────────────────────────────────────────
  const existingInvoiceIds = new Set<string>();
  for (const log of existingLogs) {
    if (!log.reason) continue;
    const match = log.reason.match(/\[([^\]]+)\]/);
    if (match) {
      match[1]
        .split(",")
        .map((s) => s.trim())
        .forEach((id) => existingInvoiceIds.add(id));
    }
  }
  const duplicateInvoices = allInvoiceIds.filter((id) =>
    existingInvoiceIds.has(id)
  );

  // ─── Group by phone ────────────────────────────────────────────────────────
  type PhoneGroup = {
    phone: string;
    customerName: string;
    pointsDefault: number;
    pointsSua: number;
    pointsTaBim: number;
    invoiceIds: Set<string>;
  };

  const groups = new Map<string, PhoneGroup>();

  for (const item of items) {
    if (!groups.has(item.phone)) {
      groups.set(item.phone, {
        phone: item.phone,
        customerName: item.customerName,
        pointsDefault: 0,
        pointsSua: 0,
        pointsTaBim: 0,
        invoiceIds: new Set(),
      });
    }
    const group = groups.get(item.phone)!;
    if (item.invoiceId) group.invoiceIds.add(item.invoiceId);

    const product = productMap.get(item.sku);
    if (product && !product.allowLoyalty) continue;

    const category = product?.productGroup?.loyaltyCategory ?? "DEFAULT";
    const pts = Math.floor(item.amount / 10000);
    if (pts <= 0) continue;

    if (category === "SUA") group.pointsSua += pts;
    else if (category === "TA_BIM") group.pointsTaBim += pts;
    else group.pointsDefault += pts;
  }

  // ─── Build response ────────────────────────────────────────────────────────
  const rows: CustomerPreviewRow[] = [];
  let matchedCount = 0;
  let unmatchedCount = 0;
  let totalPoints = 0;

  for (const group of Array.from(groups.values())) {
    const customer = customerMap.get(group.phone) ?? null;
    const matched = customer !== null;

    if (matched) {
      matchedCount++;
      totalPoints +=
        group.pointsDefault + group.pointsSua + group.pointsTaBim;
    } else {
      unmatchedCount++;
    }

    rows.push({
      phone: group.phone,
      customerName: group.customerName,
      customerId: customer?.id ?? null,
      customerDbName: customer?.name ?? null,
      pointsDefault: group.pointsDefault,
      pointsSua: group.pointsSua,
      pointsTaBim: group.pointsTaBim,
      invoiceIds: Array.from(group.invoiceIds),
      matched,
    });
  }

  const response: ParsePreviewResponse = {
    rows,
    stats: {
      totalInvoices: allInvoiceIds.length,
      matchedCustomers: matchedCount,
      unmatchedCustomers: unmatchedCount,
      noPhoneRows: noPhoneCount,
      totalPoints,
    },
    duplicateInvoices,
  };

  return NextResponse.json(response);
}
