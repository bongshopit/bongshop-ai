interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  hasHeader?: boolean;
}

export function TableSkeleton({
  columns = 5,
  rows = 8,
  hasHeader = true,
}: TableSkeletonProps) {
  return (
    <div className="rounded-lg border bg-white overflow-hidden animate-pulse">
      {hasHeader && (
        <div className="px-4 py-3 bg-gray-50 border-b flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div
              key={i}
              className="h-4 bg-gray-200 rounded"
              style={{ width: `${Math.floor(60 + (i % 3) * 20)}px` }}
            />
          ))}
        </div>
      )}
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-3">
            {Array.from({ length: columns }).map((_, j) => (
              <div
                key={j}
                className="h-4 bg-gray-100 rounded"
                style={{ width: `${Math.floor(60 + (j % 4) * 25)}px` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-24 bg-gray-200 rounded" />
        <div className="h-9 w-9 bg-gray-100 rounded-full" />
      </div>
      <div className="h-8 w-20 bg-gray-200 rounded" />
    </div>
  );
}

export function StatsSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
