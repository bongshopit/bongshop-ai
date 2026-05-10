import { gzip, gunzip } from "zlib";
import { promisify } from "util";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  backupFileSchema,
  BACKUP_VERSION,
  MAX_GZIP_SIZE_BYTES,
  MAX_JSON_SIZE_BYTES,
} from "@/lib/validators/data-management";

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

/** Chunk size cho createMany để tránh SQL statement quá lớn */
const BATCH_SIZE = 500;

export const dynamic = "force-dynamic";

// Detect gzip by magic bytes 0x1F 0x8B
function isGzip(buffer: Buffer): boolean {
  return buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b;
}

/** createMany theo batch để tránh timeout / SQL size limit với datasets lớn */
async function batchCreateMany<T>(
  createFn: (data: T[]) => Promise<unknown>,
  records: T[],
  batchSize = BATCH_SIZE
) {
  for (let i = 0; i < records.length; i += batchSize) {
    await createFn(records.slice(i, i + batchSize));
  }
}

// ── GET /api/backup — download gzip-compressed backup ────────────────────────

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const [
    loyaltySettings,
    productGroups,
    products,
    shifts,
    employees,
    shiftAssignments,
    attendances,
    payrolls,
    payrollAdjustments,
    customers,
    orders,
    orderItems,
    loyaltyLogs,
    customerStorages,
    customerStorageItems,
    cashTransactions,
  ] = await Promise.all([
    prisma.loyaltySetting.findMany(),
    prisma.productGroup.findMany(),
    prisma.product.findMany(),
    prisma.shift.findMany(),
    prisma.employee.findMany(),
    prisma.shiftAssignment.findMany(),
    prisma.attendance.findMany(),
    prisma.payroll.findMany(),
    prisma.payrollAdjustment.findMany(),
    prisma.customer.findMany(),
    prisma.order.findMany(),
    prisma.orderItem.findMany(),
    prisma.loyaltyLog.findMany(),
    prisma.customerStorage.findMany(),
    prisma.customerStorageItem.findMany(),
    prisma.cashTransaction.findMany(),
  ]);

  const backup = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      loyaltySettings,
      productGroups,
      products,
      shifts,
      employees,
      shiftAssignments,
      attendances,
      payrolls,
      payrollAdjustments,
      customers,
      orders,
      orderItems,
      loyaltyLogs,
      customerStorages,
      customerStorageItems,
      cashTransactions,
    },
  };

  const date = new Date().toISOString().split("T")[0];
  const json = Buffer.from(JSON.stringify(backup));
  const compressed = await gzipAsync(json, { level: 9 });

  return new Response(compressed, {
    headers: {
      "Content-Type": "application/gzip",
      "Content-Disposition": `attachment; filename="bongshop-backup-${date}.json.gz"`,
      "X-Uncompressed-Size": String(json.length),
    },
  });
}

// ── POST /api/backup — restore from backup file (.json or .json.gz) ──────

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return new Response(JSON.stringify({ error: "Dữ liệu không hợp lệ" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return new Response(JSON.stringify({ error: "Không tìm thấy file backup" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const compressed = isGzip(fileBuffer);

  // Kiểm tra giới hạn kích thước tỷ theo loại file
  const sizeLimit = compressed ? MAX_GZIP_SIZE_BYTES : MAX_JSON_SIZE_BYTES;
  if (fileBuffer.length > sizeLimit) {
    const limitLabel = compressed ? "10MB" : "50MB";
    return new Response(
      JSON.stringify({ error: `File backup vượt quá giới hạn ${limitLabel}` }),
      { status: 413, headers: { "Content-Type": "application/json" } }
    );
  }

  // Giải nén nếu cần
  let jsonText: string;
  try {
    if (compressed) {
      const decompressed = await gunzipAsync(fileBuffer);
      jsonText = decompressed.toString("utf8");
    } else {
      jsonText = fileBuffer.toString("utf8");
    }
  } catch {
    return new Response(
      JSON.stringify({ error: "Không thể giải nén file backup" }),
      { status: 422, headers: { "Content-Type": "application/json" } }
    );
  }

  // Parse JSON
  let rawData: unknown;
  try {
    rawData = JSON.parse(jsonText);
  } catch {
    return new Response(
      JSON.stringify({ error: "File backup không phải JSON hợp lệ" }),
      { status: 422, headers: { "Content-Type": "application/json" } }
    );
  }

  // Validate schema
  const parsed = backupFileSchema.safeParse(rawData);
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "File backup không hợp lệ";
    return new Response(JSON.stringify({ error: msg }), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data } = parsed.data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = <T>(arr: Record<string, unknown>[]): T[] => arr as unknown as T[];

  try {
    await prisma.$transaction(
      async (tx) => {
        // 1. Xóa dữ liệu hiện có (thứ tự ngược FK)
        await tx.loyaltyLog.deleteMany();
        await tx.customerStorageItem.deleteMany();
        await tx.customerStorage.deleteMany();
        await tx.orderItem.deleteMany();
        await tx.order.deleteMany();
        await tx.customer.deleteMany();
        await tx.shiftAssignment.deleteMany();
        await tx.attendance.deleteMany();
        await tx.payrollAdjustment.deleteMany();
        await tx.payroll.deleteMany();
        await tx.employee.deleteMany();
        await tx.shift.deleteMany();
        await tx.stockMovement.deleteMany();
        await tx.product.deleteMany();
        await tx.productGroup.deleteMany();
        await tx.cashTransaction.deleteMany();
        await tx.loyaltySetting.deleteMany();

        // 2. Insert dữ liệu từ backup (thứ tự thuận FK)
        for (const row of data.loyaltySettings) {
          const { updatedAt: _u, ...rest } = row as Record<string, unknown>;
          await tx.loyaltySetting.upsert({
            where: { loyaltyCategory: rest.loyaltyCategory as string },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            create: rest as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            update: rest as any,
          });
        }

        if (data.productGroups.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await tx.productGroup.createMany({ data: rows<any>(data.productGroups), skipDuplicates: true });
        }
        // Products có thể rất lớn (~21k) → batch theo BATCH_SIZE để tránh SQL statement quá lớn
        if (data.products.length > 0) {
          await batchCreateMany(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (batch) => tx.product.createMany({ data: rows<any>(batch), skipDuplicates: true }),
            data.products
          );
        }
        if (data.shifts.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await tx.shift.createMany({ data: rows<any>(data.shifts), skipDuplicates: true });
        }
        if (data.employees.length > 0) {
          const employeesNoUser = data.employees.map((e) => ({
            ...(e as Record<string, unknown>),
            userId: null, // AC-20.6: tránh FK với User
          }));
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await tx.employee.createMany({ data: rows<any>(employeesNoUser), skipDuplicates: true });
        }
        if (data.shiftAssignments.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await tx.shiftAssignment.createMany({ data: rows<any>(data.shiftAssignments), skipDuplicates: true });
        }
        if (data.attendances.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await tx.attendance.createMany({ data: rows<any>(data.attendances), skipDuplicates: true });
        }
        if (data.payrolls.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await tx.payroll.createMany({ data: rows<any>(data.payrolls), skipDuplicates: true });
        }
        if (data.payrollAdjustments.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await tx.payrollAdjustment.createMany({ data: rows<any>(data.payrollAdjustments), skipDuplicates: true });
        }
        // Customers có thể lớn (~2.5k) → batch
        if (data.customers.length > 0) {
          await batchCreateMany(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (batch) => tx.customer.createMany({ data: rows<any>(batch), skipDuplicates: true }),
            data.customers
          );
        }
        if (data.orders.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await tx.order.createMany({ data: rows<any>(data.orders), skipDuplicates: true });
        }
        if (data.orderItems.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await tx.orderItem.createMany({ data: rows<any>(data.orderItems), skipDuplicates: true });
        }
        if (data.loyaltyLogs.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await tx.loyaltyLog.createMany({ data: rows<any>(data.loyaltyLogs), skipDuplicates: true });
        }
        if (data.customerStorages.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await tx.customerStorage.createMany({ data: rows<any>(data.customerStorages), skipDuplicates: true });
        }
        if (data.customerStorageItems.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await tx.customerStorageItem.createMany({ data: rows<any>(data.customerStorageItems), skipDuplicates: true });
        }
        if (data.cashTransactions.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await tx.cashTransaction.createMany({ data: rows<any>(data.cashTransactions), skipDuplicates: true });
        }
      },
      { timeout: 120000 } // 2 phút — đủ cho datasets lớn với batching
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi không xác định";
    console.error("[Restore] Transaction failed:", err);
    return new Response(
      JSON.stringify({ error: `Restore thất bại: ${message}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
