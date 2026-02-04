"use client";

type RowsPerPageSelectProps = {
  value: number;
  onChange: (value: number) => void;
};

const OPTIONS = [10, 20, 50];

export default function RowsPerPageSelect({ value, onChange }: RowsPerPageSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-medium text-gray-600">Rows per page</label>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-8 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-700"
      >
        {OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
