export default function PayrollDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="h-5 w-40 bg-gray-200 rounded" />

      {/* Header skeleton */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="h-4 w-48 bg-gray-100 rounded" />
        </div>
        <div className="h-8 w-28 bg-gray-200 rounded" />
      </div>

      {/* Detail card skeleton */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="h-5 w-32 bg-gray-200 rounded" />
        </div>
        <div className="divide-y divide-gray-100">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between px-6 py-4">
              <div className="h-4 w-32 bg-gray-100 rounded" />
              <div className="h-4 w-24 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Adjustments skeleton */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="h-5 w-40 bg-gray-200 rounded" />
        </div>
        <div className="px-6 py-8 flex justify-center">
          <div className="h-4 w-48 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
}
