"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition, useState } from "react";
import { Input } from "@/components/ui/input";

interface EmployeeSearchProps {
  departments: string[];
}

export function EmployeeSearch({ departments }: EmployeeSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [dept, setDept] = useState(searchParams.get("department") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");

  function buildUrl(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    return `${pathname}?${params.toString()}`;
  }

  function handleSearch(value: string) {
    setSearch(value);
    startTransition(() => {
      router.push(buildUrl({ q: value }));
    });
  }

  function handleDept(value: string) {
    setDept(value);
    startTransition(() => {
      router.push(buildUrl({ department: value }));
    });
  }

  function handleStatus(value: string) {
    setStatus(value);
    startTransition(() => {
      router.push(buildUrl({ status: value }));
    });
  }

  return (
    <div
      className={`flex flex-wrap gap-3 transition-opacity ${isPending ? "opacity-60" : ""}`}
    >
      <Input
        type="search"
        placeholder="Tìm theo tên, mã NV..."
        className="max-w-xs"
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        aria-label="Tìm kiếm nhân viên"
      />
      <select
        className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value={dept}
        onChange={(e) => handleDept(e.target.value)}
        aria-label="Lọc theo phòng ban"
      >
        <option value="">Tất cả phòng ban</option>
        {departments.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      <select
        className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value={status}
        onChange={(e) => handleStatus(e.target.value)}
        aria-label="Lọc theo trạng thái"
      >
        <option value="">Tất cả trạng thái</option>
        <option value="active">Đang làm</option>
        <option value="inactive">Đã nghỉ</option>
      </select>
    </div>
  );
}
