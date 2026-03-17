type ReportFieldProps = {
  label: string;
  value: string;
};

export default function ReportField({ label, value }: ReportFieldProps) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold uppercase text-gray-400">{label}</div>
      <div className="text-sm text-gray-900">{value}</div>
    </div>
  );
}
