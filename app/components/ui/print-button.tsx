"use client";

type PrintButtonProps = {
  className?: string;
  label?: string;
};

export default function PrintButton({
  className,
  label = "Print",
}: PrintButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={
        className ??
        "rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
      }
    >
      {label}
    </button>
  );
}
