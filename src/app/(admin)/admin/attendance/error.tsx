"use client";

import { Button } from "@/components/ui/button";

export default function AttendanceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <h2 className="text-xl font-semibold text-gray-900">Đã xảy ra lỗi</h2>
      <p className="text-gray-600 text-sm">{error.message}</p>
      <Button onClick={reset}>Thử lại</Button>
    </div>
  );
}
