"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import type { Customer } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/actions/customer";

interface CustomerFormProps {
  customer?: Customer;
  action: (formData: FormData) => Promise<ActionState>;
  cancelHref: string;
}

export function CustomerForm({ customer, action, cancelHref }: CustomerFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError("");
    setFieldErrors({});

    startTransition(async () => {
      const result = await action(formData);
      if (result === null) {
        router.push("/admin/customers");
        router.refresh();
        return;
      }
      if (result?.error) setError(result.error);
      if (result?.fieldErrors) setFieldErrors(result.fieldErrors);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Tên khách hàng <span className="text-red-500">*</span>
        </label>
        <Input
          id="name"
          name="name"
          placeholder="Nguyễn Văn A"
          defaultValue={customer?.name ?? ""}
          required
        />
        {fieldErrors.name?.map((err) => (
          <p key={err} className="text-xs text-red-500">{err}</p>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Số điện thoại
          </label>
          <Input
            id="phone"
            name="phone"
            placeholder="0901234567"
            defaultValue={customer?.phone ?? ""}
          />
          {fieldErrors.phone?.map((err) => (
            <p key={err} className="text-xs text-red-500">{err}</p>
          ))}
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="khachhang@email.com"
            defaultValue={customer?.email ?? ""}
          />
          {fieldErrors.email?.map((err) => (
            <p key={err} className="text-xs text-red-500">{err}</p>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Địa chỉ
        </label>
        <Input
          id="address"
          name="address"
          placeholder="123 Đường ABC, Quận 1, TP.HCM"
          defaultValue={customer?.address ?? ""}
        />
        {fieldErrors.address?.map((err) => (
          <p key={err} className="text-xs text-red-500">{err}</p>
        ))}
      </div>

      <div className="space-y-1">
        <label htmlFor="note" className="block text-sm font-medium text-gray-700">
          Ghi chú
        </label>
        <Input
          id="note"
          name="note"
          placeholder="Thông tin thêm về khách hàng"
          defaultValue={customer?.note ?? ""}
        />
        {fieldErrors.note?.map((err) => (
          <p key={err} className="text-xs text-red-500">{err}</p>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Đang lưu..." : "Lưu"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={cancelHref}>Hủy</Link>
        </Button>
      </div>
    </form>
  );
}
