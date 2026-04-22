"use client";

export default function ShiftsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <h2 className="text-lg font-semibold text-gray-900">Da xay ra loi</h2>
      <p className="text-sm text-gray-500">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
      >
        Thu lai
      </button>
    </div>
  );
}
