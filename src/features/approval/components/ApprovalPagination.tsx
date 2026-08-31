interface ApprovalPaginationProps {
  page: number;
  onPageChange: (nextPage: number) => void;
}

export function ApprovalPagination({ page, onPageChange }: ApprovalPaginationProps) {
  const currentPage = Number.isFinite(page) && page > 0 ? page : 1;

  return (
    <div className="flex items-center justify-center gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
      <button
        type="button"
        aria-label="Previous page"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
        className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-[#0D162B] transition hover:border-gray-300 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Prev
      </button>

      <div className="min-w-[84px] text-center text-sm font-bold text-[#0D162B]">
        Page {currentPage}
      </div>

      <button
        type="button"
        aria-label="Next page"
        onClick={() => onPageChange(currentPage + 1)}
        className="inline-flex items-center justify-center rounded-xl border border-[#E84D2A] bg-[#E84D2A] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#D6451F]"
      >
        Next
      </button>
    </div>
  );
}
