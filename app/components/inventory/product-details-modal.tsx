import Button from "~/app/components/ui/button";
import { InventoryProduct } from "~/app/components/inventory/types";

type ProductDetailsModalProps = {
  product: InventoryProduct | null;
  statusColors: Record<string, string>;
  onClose: () => void;
  onEdit: (product: InventoryProduct) => void;
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-1">
    <div className="text-xs font-semibold uppercase text-gray-400">{label}</div>
    <div className="text-sm text-gray-900">{value}</div>
  </div>
);

export default function ProductDetailsModal({
  product,
  statusColors,
  onClose,
  onEdit,
}: ProductDetailsModalProps) {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close product details"
      />
      <div className="relative w-full max-w-3xl px-4" role="dialog" aria-modal="true">
        <div className="rounded-2xl bg-white shadow-xl">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <div className="text-lg font-semibold text-gray-900">{product.product}</div>
              <div className="text-sm text-gray-500">SKU: {product.sku || "-"}</div>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" onClick={() => onEdit(product)}>
                Edit
              </Button>
              <button
                type="button"
                className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>

          <div className="grid gap-4 px-5 py-4 md:grid-cols-2">
            <DetailRow label="Product" value={product.product} />
            <DetailRow label="Brand" value={product.brand} />
            <DetailRow label="Serial Number" value={product.snNumber ?? "-"} />
            <DetailRow label="Specification" value={product.specification ?? "-"} />
            <DetailRow label="Category" value={product.category?.name ?? "-"} />
            <DetailRow label="Asset Type" value={product.assetType?.name ?? "-"} />
            <DetailRow
              label="Ordered Date"
              value={
                product.orderedDate
                  ? new Date(product.orderedDate).toLocaleDateString()
                  : "-"
              }
            />
            <DetailRow label="Cost" value={product.cost ?? "-"} />
            <DetailRow label="Warranty" value={product.warrantyName ?? "-"} />
            <DetailRow
              label="Warranty Expire"
              value={
                product.warrantyExpire
                  ? new Date(product.warrantyExpire).toLocaleDateString()
                  : "-"
              }
            />
            <DetailRow label="Assigned To" value={product.assignedTo ?? "-"} />
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase text-gray-400">Status</div>
              <div className="flex items-center gap-2 text-sm text-gray-900">
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${
                    statusColors[product.status] ?? "bg-gray-400"
                  }`}
                />
                <span>{product.status}</span>
              </div>
            </div>
            <DetailRow
              label="Created"
              value={new Date(product.createdAt).toLocaleDateString()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
