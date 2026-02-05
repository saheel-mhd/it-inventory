"use client";

import type { ReactNode } from "react";

type FilterPanelProps = {
  children: ReactNode;
  isLoading?: boolean;
};

export default function FilterPanel({ children, isLoading }: FilterPanelProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">Filters</div>
      {children}
      {isLoading && <div className="text-xs text-gray-500">Updating...</div>}
    </div>
  );
}
