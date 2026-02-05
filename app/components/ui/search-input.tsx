"use client";

import type { InputHTMLAttributes } from "react";

type SearchInputProps = InputHTMLAttributes<HTMLInputElement>;

export default function SearchInput({ className = "", ...props }: SearchInputProps) {
  return (
    <input
      {...props}
      className={`w-80 rounded-lg border border-gray-300 bg-white/95 px-3 py-2 text-sm text-gray-900 shadow-sm backdrop-blur-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${className}`.trim()}
    />
  );
}
