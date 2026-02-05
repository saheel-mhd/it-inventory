"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export default function Button({ className, children, ...props }: ButtonProps) {
  const baseClassName =
    "rounded-lg border border-[#8b5e3c] bg-[#c9a227] px-4 py-2 text-sm font-semibold text-black shadow-sm shadow-black/10 hover:-translate-y-0.5 hover:bg-[#b08e24] focus:outline-none focus:ring-2 focus:ring-blue-200";

  return (
    <button className={`${baseClassName}${className ? ` ${className}` : ""}`} {...props}>
      {children}
    </button>
  );
}
