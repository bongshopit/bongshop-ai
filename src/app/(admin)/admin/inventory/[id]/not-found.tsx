import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-gray-700 font-medium mb-2">Không tìm thấy sản phẩm</p>
      <p className="text-sm text-gray-500 mb-6">
        Sản phẩm này không tồn tại hoặc đã bị xóa.
      </p>
      <Link
        href="/admin/inventory"
        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
      >
        Về danh sách tồn kho
      </Link>
    </div>
  );
}
