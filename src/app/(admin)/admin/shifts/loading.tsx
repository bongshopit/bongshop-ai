export default function ShiftsLoading() {
  return (
    <div>
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="space-y-8">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-lg border bg-white overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 flex justify-between items-center">
              <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="p-4 space-y-3">
              {[0, 1, 2].map((j) => (
                <div key={j} className="h-10 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
