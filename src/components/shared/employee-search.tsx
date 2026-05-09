"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition, useState } from "react";
import { Input } from "@/components/ui/input";

export function EmployeeSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");

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

  return (
    <div className={`flex flex-wrap gap-3 transition-opacity ${isPending ? "opacity-60" : ""}`}>
      <Input
        type="search"
        placeholder="Tìm theo tên, mã NV..."
        className="max-w-xs"
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        aria-label="Tìm kiếm nhân viên"
      />
    </div>
  );
}
