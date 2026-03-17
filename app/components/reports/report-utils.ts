export const getSearchParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] ?? "" : value ?? "";

export const formatDate = (value: Date | null | undefined) =>
  value ? value.toLocaleDateString() : "-";

const toLabel = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const formatReturnReason = (
  reason: string | null | undefined,
  note: string | null | undefined,
) => {
  if (!reason) return "-";
  const base = reason === "OTHER" ? "Other" : toLabel(reason);
  return note ? `${base} - ${note}` : base;
};

export const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-green-500",
  DAMAGED: "bg-red-500",
  ACTIVE_USE: "bg-blue-500",
  UNDER_SERVICE: "bg-orange-500",
  SERVICEABLE: "bg-sky-500",
};
