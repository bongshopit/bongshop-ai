export default function AttendanceLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded mb-6" />
      <div className="h-24 bg-gray-200 rounded-lg mb-6" />
      <div className="flex gap-3 mb-4">
        <div className="h-14 w-32 bg-gray-200 rounded" />
        <div className="h-14 w-32 bg-gray-200 rounded" />
        <div className="h-14 w-48 bg-gray-200 rounded" />
      </div>
      <div className="h-64 bg-gray-200 rounded-lg" />
    </div>
  );
}
