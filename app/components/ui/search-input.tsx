"use client";

import type { InputHTMLAttributes } from "react";

type SearchInputProps = InputHTMLAttributes<HTMLInputElement>;

export default function SearchInput({ className = "", ...props }: SearchInputProps) {
  return (
    <input
      {...props}
      className={`w-80 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${className}`.trim()}
    />
  );
}
