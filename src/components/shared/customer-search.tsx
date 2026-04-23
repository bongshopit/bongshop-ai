"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Input } from "@/components/ui/input";

export function CustomerSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    startTransition(() => {
      router.push(`/admin/customers?${params.toString()}`);
    });
  }

  return (
    <Input
      placeholder="Tìm theo tên hoặc SĐT..."
      defaultValue={searchParams.get("q") ?? ""}
      onChange={handleSearch}
      className="max-w-sm"
    />
  );
}
