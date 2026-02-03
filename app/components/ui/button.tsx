"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export default function Button({ className, children, ...props }: ButtonProps) {
  const baseClassName =
    "rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700";

  return (
    <button className={`${baseClassName}${className ? ` ${className}` : ""}`} {...props}>
      {children}
    </button>
  );
}
