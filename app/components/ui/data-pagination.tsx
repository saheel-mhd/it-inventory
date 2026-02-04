"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "~/app/components/ui/pagination";

type DataPaginationProps = {
  currentPage: number;
  totalPages: number;
  getHref?: (page: number) => string;
  onPageChange?: (page: number) => void;
};

export default function DataPagination({
  currentPage,
  totalPages,
  getHref,
  onPageChange,
}: DataPaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  const canPrev = safeCurrentPage > 1;
  const canNext = safeCurrentPage < safeTotalPages;
  const prevPage = Math.max(1, safeCurrentPage - 1);
  const nextPage = Math.min(safeTotalPages, safeCurrentPage + 1);

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          {getHref ? (
            <PaginationLink
              href={getHref(prevPage)}
              className="w-auto px-3"
              aria-disabled={!canPrev}
            >
              Prev
            </PaginationLink>
          ) : (
            <button
              type="button"
              onClick={() => onPageChange?.(prevPage)}
              disabled={!canPrev}
              className="inline-flex h-9 w-auto items-center justify-center rounded-md border border-gray-200 px-3 text-sm text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Prev
            </button>
          )}
        </PaginationItem>

        {Array.from({ length: safeTotalPages }, (_, index) => {
          const pageNumber = index + 1;
          return (
            <PaginationItem key={pageNumber}>
              {getHref ? (
                <PaginationLink
                  href={getHref(pageNumber)}
                  isActive={pageNumber === safeCurrentPage}
                >
                  {pageNumber}
                </PaginationLink>
              ) : (
                <button
                  type="button"
                  onClick={() => onPageChange?.(pageNumber)}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm transition ${
                    pageNumber === safeCurrentPage
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {pageNumber}
                </button>
              )}
            </PaginationItem>
          );
        })}

        <PaginationItem>
          {getHref ? (
            <PaginationLink
              href={getHref(nextPage)}
              className="w-auto px-3"
              aria-disabled={!canNext}
            >
              Next
            </PaginationLink>
          ) : (
            <button
              type="button"
              onClick={() => onPageChange?.(nextPage)}
              disabled={!canNext}
              className="inline-flex h-9 w-auto items-center justify-center rounded-md border border-gray-200 px-3 text-sm text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          )}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
