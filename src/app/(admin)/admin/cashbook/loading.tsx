export default function CashbookLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-white p-5">
            <div className="h-16 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-lg border bg-white p-6 h-64 animate-pulse bg-gray-50" />
        <div className="lg:col-span-2 rounded-lg border bg-white h-64 animate-pulse bg-gray-50" />
      </div>
    </div>
  );
}
