"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function CustomersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <p className="text-gray-600 text-sm">Đã xảy ra lỗi khi tải danh sách khách hàng.</p>
      <Button onClick={reset} variant="outline">
        Thử lại
      </Button>
    </div>
  );
}
