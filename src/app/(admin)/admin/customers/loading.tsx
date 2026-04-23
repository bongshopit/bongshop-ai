export default function CustomersLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="h-9 w-36 bg-gray-200 rounded" />
      </div>
      <div className="h-10 w-80 bg-gray-200 rounded mb-4" />
      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-3 flex gap-4">
              <div className="h-5 w-32 bg-gray-200 rounded" />
              <div className="h-5 w-28 bg-gray-200 rounded" />
              <div className="h-5 w-40 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
