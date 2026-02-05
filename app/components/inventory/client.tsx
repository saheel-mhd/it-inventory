"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Button from "~/app/components/ui/button";
import DataPagination from "~/app/components/ui/data-pagination";
import RowsPerPageSelect from "~/app/components/ui/rows-per-page-select";
import DamageModal from "~/app/components/products/damage-modal";
import EditItemModal from "~/app/components/products/edit-item-modal";
import InventoryToolbar from "~/app/components/inventory/toolbar";
import ReturnProductModal from "~/app/components/staff/return-product-modal";
import { IconReturn } from "~/app/components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/app/components/ui/table";

type Option = {
  id: string;
  name: string;
  assetTypeId?: string | null;
  prefix?: string | null;
  isActive?: boolean;
};

type Product = {
  id: string;
  product: string;
  brand: string;
  snNumber: string | null;
  sku: string;
  specification: string | null;
  orderedDate: string | null;
  cost: string | null;
  warrantyPeriodId: string | null;
  warrantyName: string | null;
  warrantyExpire: string | null;
  categoryId: string;
  assetTypeId: string;
  assignedTo: string | null;
  activeAssignmentId: string | null;
  status: string;
  createdAt: string;
  category?: Option | null;
  assetType?: Option | null;
};

type InventoryClientProps = {
  initialProducts: Product[];
  categories: Option[];
  assetTypes: Option[];
  warrantyPeriods: Array<{ id: string; name: string; months: number }>;
  statusOptions: Array<{ value: string; label: string }>;
  assignProducts: Array<{ id: string; sku: string; product: string }>;
  staffOptions: Array<{ id: string; name: string }>;
};

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-green-500",
  DAMAGED: "bg-red-500",
  ACTIVE_USE: "bg-blue-500",
  UNDER_SERVICE: "bg-orange-500",
  SERVICEABLE: "bg-sky-500",
};

export default function InventoryClient({
  initialProducts,
  categories,
  assetTypes,
  warrantyPeriods,
  statusOptions,
  assignProducts,
  staffOptions,
}: InventoryClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [filters, setFilters] = useState({
    q: "",
    categoryId: "",
    status: "",
    sort: "updated_desc",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [damageProduct, setDamageProduct] = useState<Product | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const activeRequest = useRef(0);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.q.trim()) params.set("q", filters.q.trim());
    if (filters.categoryId) params.set("categoryId", filters.categoryId);
    if (filters.status) params.set("status", filters.status);
    if (filters.sort) params.set("sort", filters.sort);
    return params.toString();
  }, [filters]);

  const loadProducts = async (query: string) => {
    const requestId = Date.now();
    activeRequest.current = requestId;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/products?${query}`, { cache: "no-store" });
      if (!response.ok) return;
      const payload = await response.json();
      if (activeRequest.current !== requestId) return;
      setProducts(payload.products ?? []);
    } finally {
      if (activeRequest.current === requestId) setIsLoading(false);
    }
  };

  useEffect(() => {
    const handle = setTimeout(() => loadProducts(queryString), 300);
    return () => clearTimeout(handle);
  }, [queryString]);

  useEffect(() => {
    setCurrentPage(1);
  }, [queryString]);

  const totalPages = Math.max(1, Math.ceil(products.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return products.slice(start, start + pageSize);
  }, [currentPage, pageSize, products]);

  return (
    <div className="space-y-4">
      <InventoryToolbar
        categories={categories}
        assetTypes={assetTypes}
        warrantyPeriods={warrantyPeriods}
        statusOptions={statusOptions}
        assignProducts={assignProducts}
        staffOptions={staffOptions}
        filters={filters}
        onFilterChange={setFilters}
        onCreated={() => loadProducts(queryString)}
        isLoading={isLoading}
      />

      <div className="rounded-xl border bg-white shadow-sm">
        <div className="p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Specification</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-gray-900">{item.product}</TableCell>
                  <TableCell>{item.sku ?? "-"}</TableCell>
                  <TableCell>{item.specification ?? "-"}</TableCell>
                  <TableCell>{item.assignedTo ?? "-"}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-block h-2.5 w-2.5 rounded-full ${
                        STATUS_COLORS[item.status] ?? "bg-gray-400"
                      }`}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
                        onClick={() => setSelectedProduct(item)}
                        aria-label="View product"
                      >
                        👁️
                      </button>
                      {item.activeAssignmentId && (
                        <ReturnProductModal
                          assignmentId={item.activeAssignmentId}
                          productName={item.product}
                          sku={item.sku}
                          staffName={item.assignedTo}
                          triggerLabel=""
                          triggerIcon={<IconReturn className="h-4 w-4" />}
                          triggerClassName="inline-flex items-center justify-center rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
                          onSaved={() => loadProducts(queryString)}
                        />
                      )}
                      {item.status !== "DAMAGED" && (
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-md px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                          onClick={() => setDamageProduct(item)}
                          aria-label="Mark damaged"
                        >
                          🛠️
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {products.length === 0 && (
                <TableRow>
                  <TableCell className="py-8 text-center text-gray-500" colSpan={6}>
                    No products in inventory yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between border-t px-3 py-2">
          <RowsPerPageSelect
            value={pageSize}
            onChange={(nextSize) => {
              setPageSize(nextSize);
              setCurrentPage(1);
            }}
          />
          <DataPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelectedProduct(null)}
            aria-label="Close product details"
          />
          <div className="relative w-full max-w-3xl px-4" role="dialog" aria-modal="true">
            <div className="rounded-2xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div>
                  <div className="text-lg font-semibold text-gray-900">{selectedProduct.product}</div>
                  <div className="text-sm text-gray-500">SKU: {selectedProduct.sku || "-"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setEditProduct(selectedProduct);
                      setSelectedProduct(null);
                    }}
                  >
                    Edit
                  </Button>
                  <button
                    type="button"
                    className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
                    onClick={() => setSelectedProduct(null)}
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="grid gap-4 px-5 py-4 md:grid-cols-2">
                <div className="space-y-1"><div className="text-xs font-semibold uppercase text-gray-400">Product</div><div className="text-sm text-gray-900">{selectedProduct.product}</div></div>
                <div className="space-y-1"><div className="text-xs font-semibold uppercase text-gray-400">Brand</div><div className="text-sm text-gray-900">{selectedProduct.brand}</div></div>
                <div className="space-y-1"><div className="text-xs font-semibold uppercase text-gray-400">Serial Number</div><div className="text-sm text-gray-900">{selectedProduct.snNumber ?? "-"}</div></div>
                <div className="space-y-1"><div className="text-xs font-semibold uppercase text-gray-400">Specification</div><div className="text-sm text-gray-900">{selectedProduct.specification ?? "-"}</div></div>
                <div className="space-y-1"><div className="text-xs font-semibold uppercase text-gray-400">Category</div><div className="text-sm text-gray-900">{selectedProduct.category?.name ?? "-"}</div></div>
                <div className="space-y-1"><div className="text-xs font-semibold uppercase text-gray-400">Asset Type</div><div className="text-sm text-gray-900">{selectedProduct.assetType?.name ?? "-"}</div></div>
                <div className="space-y-1"><div className="text-xs font-semibold uppercase text-gray-400">Ordered Date</div><div className="text-sm text-gray-900">{selectedProduct.orderedDate ? new Date(selectedProduct.orderedDate).toLocaleDateString() : "-"}</div></div>
                <div className="space-y-1"><div className="text-xs font-semibold uppercase text-gray-400">Cost</div><div className="text-sm text-gray-900">{selectedProduct.cost ?? "-"}</div></div>
                <div className="space-y-1"><div className="text-xs font-semibold uppercase text-gray-400">Warranty</div><div className="text-sm text-gray-900">{selectedProduct.warrantyName ?? "-"}</div></div>
                <div className="space-y-1"><div className="text-xs font-semibold uppercase text-gray-400">Warranty Expire</div><div className="text-sm text-gray-900">{selectedProduct.warrantyExpire ? new Date(selectedProduct.warrantyExpire).toLocaleDateString() : "-"}</div></div>
                <div className="space-y-1"><div className="text-xs font-semibold uppercase text-gray-400">Assigned To</div><div className="text-sm text-gray-900">{selectedProduct.assignedTo ?? "-"}</div></div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase text-gray-400">Status</div>
                  <div className="flex items-center gap-2 text-sm text-gray-900">
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${STATUS_COLORS[selectedProduct.status] ?? "bg-gray-400"}`} />
                    <span>{selectedProduct.status}</span>
                  </div>
                </div>
                <div className="space-y-1"><div className="text-xs font-semibold uppercase text-gray-400">Created</div><div className="text-sm text-gray-900">{new Date(selectedProduct.createdAt).toLocaleDateString()}</div></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <DamageModal
        open={Boolean(damageProduct)}
        product={
          damageProduct
            ? {
                id: damageProduct.id,
                product: damageProduct.product,
                sku: damageProduct.sku,
                warrantyExpire: damageProduct.warrantyExpire,
                cost: damageProduct.cost,
                status: damageProduct.status,
              }
            : null
        }
        onClose={() => setDamageProduct(null)}
        onSaved={() => loadProducts(queryString)}
      />

      <EditItemModal
        open={Boolean(editProduct)}
        product={
          editProduct
            ? {
                id: editProduct.id,
                product: editProduct.product,
                brand: editProduct.brand,
                snNumber: editProduct.snNumber,
                sku: editProduct.sku,
                specification: editProduct.specification,
                orderedDate: editProduct.orderedDate,
                cost: editProduct.cost,
                warrantyPeriodId: editProduct.warrantyPeriodId,
                warrantyExpire: editProduct.warrantyExpire,
                categoryId: editProduct.categoryId,
                assetTypeId: editProduct.assetTypeId,
                status: editProduct.status,
              }
            : null
        }
        categories={categories}
        assetTypes={assetTypes}
        warrantyPeriods={warrantyPeriods}
        statusOptions={statusOptions}
        onClose={() => setEditProduct(null)}
        onSaved={() => loadProducts(queryString)}
      />
    </div>
  );
}
