"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export default function Button({ className, children, ...props }: ButtonProps) {
  const baseClassName =
    "rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-black/10 transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200";

  return (
    <button className={`${baseClassName}${className ? ` ${className}` : ""}`} {...props}>
      {children}
    </button>
  );
}
