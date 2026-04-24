import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  baseUrl: string;
  searchParams?: Record<string, string>;
}

function buildHref(
  baseUrl: string,
  page: number,
  searchParams: Record<string, string>
): string {
  const params = new URLSearchParams({ ...searchParams, page: String(page) });
  return `${baseUrl}?${params.toString()}`;
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [];

  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, "...", total);
  } else if (current >= total - 3) {
    pages.push(1, "...", total - 4, total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, "...", current - 1, current, current + 1, "...", total);
  }

  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  baseUrl,
  searchParams = {},
}: PaginationProps) {
  if (totalItems === 0 || totalPages <= 1) return null;

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  const paramsCleaned = Object.fromEntries(
    Object.entries(searchParams).filter(([k]) => k !== "page")
  );

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-t text-sm text-gray-600">
      <span className="text-xs">
        Hiển thị{" "}
        <span className="font-medium text-gray-900">
          {from}–{to}
        </span>{" "}
        / <span className="font-medium text-gray-900">{totalItems}</span> kết quả
      </span>

      <nav className="flex items-center gap-1" aria-label="Phân trang">
        {/* Nút Trước */}
        {currentPage <= 1 ? (
          <span className="inline-flex items-center px-2 py-1 rounded text-gray-400 cursor-not-allowed select-none">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Trang trước</span>
          </span>
        ) : (
          <Link
            href={buildHref(baseUrl, currentPage - 1, paramsCleaned)}
            className="inline-flex items-center px-2 py-1 rounded hover:bg-gray-200 transition-colors"
            aria-label="Trang trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
        )}

        {/* Số trang */}
        {pageNumbers.map((p, idx) =>
          p === "..." ? (
            <span key={`ellipsis-${idx}`} className="px-2 py-1 text-gray-400 select-none">
              …
            </span>
          ) : p === currentPage ? (
            <span
              key={p}
              aria-current="page"
              className="inline-flex items-center justify-center w-8 h-8 rounded bg-blue-600 text-white text-xs font-semibold select-none"
            >
              {p}
            </span>
          ) : (
            <Link
              key={p}
              href={buildHref(baseUrl, p, paramsCleaned)}
              className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-200 transition-colors text-xs"
            >
              {p}
            </Link>
          )
        )}

        {/* Nút Sau */}
        {currentPage >= totalPages ? (
          <span className="inline-flex items-center px-2 py-1 rounded text-gray-400 cursor-not-allowed select-none">
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Trang sau</span>
          </span>
        ) : (
          <Link
            href={buildHref(baseUrl, currentPage + 1, paramsCleaned)}
            className="inline-flex items-center px-2 py-1 rounded hover:bg-gray-200 transition-colors"
            aria-label="Trang sau"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </nav>
    </div>
  );
}
