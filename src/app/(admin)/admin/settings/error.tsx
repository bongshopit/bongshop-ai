"use client";

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <p className="text-red-600 font-medium">Lỗi tải trang cài đặt</p>
      <p className="text-sm text-gray-500">{error.message}</p>
      <button
        onClick={reset}
        className="text-sm text-blue-600 hover:underline"
      >
        Thử lại
      </button>
    </div>
  );
}
