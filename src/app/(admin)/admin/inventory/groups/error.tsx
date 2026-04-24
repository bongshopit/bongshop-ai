"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProductGroupsError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="p-6 flex flex-col items-center gap-4 text-center">
      <p className="text-red-600 font-medium">Lỗi tải nhóm hàng: {error.message}</p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={reset}>
          Thử lại
        </Button>
        <Button asChild variant="ghost">
          <Link href="/admin/inventory">Quay lại</Link>
        </Button>
      </div>
    </div>
  );
}
