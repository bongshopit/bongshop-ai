"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function PayrollError({
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
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <h2 className="text-xl font-semibold text-red-600">Có lỗi xảy ra</h2>
      <p className="text-sm text-gray-500">{error.message}</p>
      <Button onClick={reset}>Thử lại</Button>
    </div>
  );
}
