"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  customerCreateSchema,
  customerUpdateSchema,
  customerImportRowSchema,
  createStorageSchema,
  takeStorageItemSchema,
  type CustomerImportRow,
} from "@/lib/validators/customer";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

function normalizeOptionalString(val: FormDataEntryValue | null): string | undefined {
  if (!val || String(val).trim() === "") return undefined;
  return String(val).trim();
}

export async function createCustomer(formData: FormData): Promise<ActionState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    phone: normalizeOptionalString(formData.get("phone")),
    email: normalizeOptionalString(formData.get("email")),
    address: normalizeOptionalString(formData.get("address")),
    note: normalizeOptionalString(formData.get("note")),
  };

  const parsed = customerCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  if (parsed.data.phone) {
    const existing = await prisma.customer.findUnique({
      where: { phone: parsed.data.phone },
    });
    if (existing) {
      return { error: "Số điện thoại đã được đăng ký" };
    }
  } else {
    // Không có SĐT → kiểm tra trùng tên chính xác
    const existing = await prisma.customer.findFirst({
      where: { name: parsed.data.name },
    });
    if (existing) {
      return { error: "Khách hàng với tên này đã tồn tại" };
    }
  }

  await prisma.customer.create({
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone ?? null,
      email: parsed.data.email ?? null,
      address: parsed.data.address ?? null,
      note: parsed.data.note ?? null,
    },
  });

  revalidatePath("/admin/customers");
  return null;
}

export async function updateCustomer(
  id: string,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    phone: normalizeOptionalString(formData.get("phone")),
    email: normalizeOptionalString(formData.get("email")),
    address: normalizeOptionalString(formData.get("address")),
    note: normalizeOptionalString(formData.get("note")),
  };

  const parsed = customerUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  if (parsed.data.phone) {
    const existing = await prisma.customer.findFirst({
      where: { phone: parsed.data.phone, id: { not: id } },
    });
    if (existing) {
      return { error: "Số điện thoại đã được đăng ký" };
    }
  } else {
    // Không có SĐT → kiểm tra trùng tên chính xác (ngoại trừ chính mình)
    const existing = await prisma.customer.findFirst({
      where: { name: parsed.data.name, id: { not: id } },
    });
    if (existing) {
      return { error: "Khách hàng với tên này đã tồn tại" };
    }
  }

  await prisma.customer.update({
    where: { id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone ?? null,
      email: parsed.data.email ?? null,
      address: parsed.data.address ?? null,
      note: parsed.data.note ?? null,
    },
  });

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${id}`);
  return null;
}

export async function deleteCustomer(id: string): Promise<ActionState> {
  const orderCount = await prisma.order.count({ where: { customerId: id } });
  if (orderCount > 0) {
    return { error: "Không thể xóa khách hàng đã có đơn hàng" };
  }
  await prisma.customer.delete({ where: { id } });
  revalidatePath("/admin/customers");
  return null;
}

export type ImportResult = { imported: number; skipped: number };
export type ImportActionState = ImportResult | { error: string };

export async function importCustomers(
  rows: unknown[]
): Promise<ImportActionState> {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { error: "Không có dữ liệu để import" };
  }
  if (rows.length > 1000) {
    return { error: "Mỗi batch tối đa 1.000 dòng" };
  }

  // Server-side re-validate each row
  const validRows: CustomerImportRow[] = [];
  for (const row of rows) {
    const parsed = customerImportRowSchema.safeParse(row);
    if (parsed.success) {
      validRows.push(parsed.data);
    }
  }

  if (validRows.length === 0) {
    return { error: "Không có dòng hợp lệ để import" };
  }

  // Tách rows có SĐT và không có SĐT
  const withPhone = validRows.filter((r) => !!r.phone);
  const noPhone = validRows.filter((r) => !r.phone);

  // Rows không có SĐT: lọc trùng tên với DB
  let filteredNoPhone = noPhone;
  if (noPhone.length > 0) {
    const namesToCheck = noPhone.map((r) => r.name);
    const existingNames = new Set(
      (await prisma.customer.findMany({
        where: { name: { in: namesToCheck } },
        select: { name: true },
      })).map((c) => c.name)
    );
    filteredNoPhone = noPhone.filter((r) => !existingNames.has(r.name));
  }

  const toCreate = [
    ...withPhone.map((row) => ({
      name: row.name,
      phone: row.phone ?? null,
      email: row.email ?? null,
      address: row.address ?? null,
      note: row.note ?? null,
      dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : null,
      gender: row.gender ?? null,
      loyaltyPointsDefault: row.loyaltyPointsDefault ?? 0,
    })),
    ...filteredNoPhone.map((row) => ({
      name: row.name,
      phone: null,
      email: row.email ?? null,
      address: row.address ?? null,
      note: row.note ?? null,
      dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : null,
      gender: row.gender ?? null,
      loyaltyPointsDefault: row.loyaltyPointsDefault ?? 0,
    })),
  ];

  const result = await prisma.customer.createMany({
    data: toCreate,
    skipDuplicates: true, // xử lý trùng SĐT (unique constraint)
  });

  revalidatePath("/admin/customers");

  return {
    imported: result.count,
    skipped: validRows.length - result.count,
  };
}

// ==================== US-016: Gửi hàng ====================

export async function createCustomerStorage(
  formData: FormData
): Promise<ActionState> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Chưa đăng nhập" };
  if (session.user.role === "STAFF") return { error: "Không có quyền" };

  const customerId = String(formData.get("customerId") ?? "");
  const note = String(formData.get("note") ?? "").trim() || undefined;

  // items được encode là JSON string
  const itemsRaw = formData.get("items");
  let itemsParsed: unknown;
  try {
    itemsParsed = JSON.parse(String(itemsRaw ?? "[]"));
  } catch {
    return { error: "Dữ liệu sản phẩm không hợp lệ" };
  }

  const parsed = createStorageSchema.safeParse({ customerId, note, items: itemsParsed });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await prisma.customerStorage.create({
    data: {
      customerId: parsed.data.customerId,
      note: parsed.data.note ?? null,
      status: "OPEN",
      createdBy: session.user.id,
      items: {
        create: parsed.data.items.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          takenQty: 0,
          note: item.note ?? null,
        })),
      },
    },
  });

  revalidatePath(`/admin/customers/${customerId}`);
  return null;
}

export async function takeStorageItem(
  formData: FormData
): Promise<ActionState> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Chưa đăng nhập" };
  if (session.user.role === "STAFF") return { error: "Không có quyền" };

  const parsed = takeStorageItemSchema.safeParse({
    itemId: formData.get("itemId"),
    qty: formData.get("qty"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const item = await prisma.customerStorageItem.findUnique({
    where: { id: parsed.data.itemId },
    include: { storage: true },
  });
  if (!item) return { error: "Không tìm thấy sản phẩm" };
  if (item.storage.status === "CLOSED") return { error: "Phiếu đã đóng" };

  const remaining = item.quantity - item.takenQty;
  if (parsed.data.qty > remaining) {
    return { error: `Số lượng lấy không được vượt quá số còn lại (${remaining})` };
  }

  const newTakenQty = item.takenQty + parsed.data.qty;

  await prisma.customerStorageItem.update({
    where: { id: item.id },
    data: { takenQty: newTakenQty },
  });

  // Kiểm tra tất cả items đã lấy hết → tự đóng phiếu
  const allItems = await prisma.customerStorageItem.findMany({
    where: { storageId: item.storageId },
    select: { quantity: true, takenQty: true, id: true },
  });
  const updatedItems = allItems.map((i) =>
    i.id === item.id ? { ...i, takenQty: newTakenQty } : i
  );
  const allTaken = updatedItems.every((i) => i.takenQty >= i.quantity);
  if (allTaken) {
    await prisma.customerStorage.update({
      where: { id: item.storageId },
      data: { status: "CLOSED" },
    });
  }

  revalidatePath(`/admin/customers/${item.storage.customerId}`);
  return null;
}

export async function closeCustomerStorage(
  storageId: string
): Promise<ActionState> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Chưa đăng nhập" };
  if (session.user.role === "STAFF") return { error: "Không có quyền" };

  const storage = await prisma.customerStorage.findUnique({
    where: { id: storageId },
    select: { id: true, customerId: true, status: true },
  });
  if (!storage) return { error: "Không tìm thấy phiếu" };
  if (storage.status === "CLOSED") return { error: "Phiếu đã được đóng" };

  await prisma.customerStorage.update({
    where: { id: storageId },
    data: { status: "CLOSED" },
  });

  revalidatePath(`/admin/customers/${storage.customerId}`);
  return null;
}

export async function deleteAllCustomerStorages(
  customerId: string
): Promise<ActionState> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Chưa đăng nhập" };
  if (session.user.role === "STAFF") return { error: "Không có quyền" };

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { id: true },
  });
  if (!customer) return { error: "Không tìm thấy khách hàng" };

  await prisma.customerStorage.deleteMany({ where: { customerId } });

  revalidatePath(`/admin/customers/${customerId}`);
  return null;
}

export async function deleteAllCustomers(): Promise<ActionState> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Chưa đăng nhập" };
  if (session.user.role === "STAFF") return { error: "Không có quyền" };

  // Xóa theo thứ tự để tránh vi phạm foreign key:
  // CustomerStorageItem → CustomerStorage → LoyaltyLog → Order → Customer
  await prisma.$transaction([
    prisma.customerStorageItem.deleteMany({}),
    prisma.customerStorage.deleteMany({}),
    prisma.loyaltyLog.deleteMany({}),
    prisma.order.deleteMany({}),
    prisma.customer.deleteMany({}),
  ]);

  revalidatePath("/admin/customers");
  return null;
}
