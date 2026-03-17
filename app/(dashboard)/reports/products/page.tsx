import Link from "next/link";
import SelectedProductReport from "~/app/components/reports/selected-product-report";
import { getSearchParam } from "~/app/components/reports/report-utils";
import LiveSearchInput from "~/app/components/ui/live-search-input";
import { IconEye } from "~/app/components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/app/components/ui/table";
import { prisma } from "~/lib/prisma";

type ProductReportSearchParams = {
  q?: string | string[];
  productId?: string | string[];
};

export default async function ProductReportPage({
  searchParams,
}: {
  searchParams?: Promise<ProductReportSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const q = getSearchParam(resolvedSearchParams?.q);
  const productId = getSearchParam(resolvedSearchParams?.productId);

  const products = await prisma.product.findMany({
    where: q
      ? {
          OR: [
            { product: { contains: q, mode: "insensitive" as const } },
            { sku: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : undefined,
    orderBy: { updatedAt: "desc" },
    take: 25,
    select: {
      id: true,
      sku: true,
      product: true,
      brand: true,
    },
  });

  const selectedProduct = productId
    ? await prisma.product.findUnique({
        where: { id: productId },
        include: {
          category: true,
          assetType: true,
          warrantyPeriod: true,
          staffAssignments: {
            orderBy: { startDate: "desc" },
            include: { staff: { include: { department: true } } },
          },
          services: { orderBy: { createdAt: "desc" } },
        },
      })
    : null;

  const params = new URLSearchParams();
  if (q.trim()) params.set("q", q.trim());
  const clearHref =
    params.size > 0 ? `/reports/products?${params.toString()}` : "/reports/products";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-gray-900">Product Report</div>
          <div className="mt-1 text-sm text-gray-600">
            Search a product by name or SKU, then open it to view full history.
          </div>
        </div>
        <Link href="/reports" className="text-sm font-medium text-gray-600 hover:text-gray-900">
          Back to Reports
        </Link>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <LiveSearchInput
            defaultValue={q}
            placeholder="Search by product name or SKU..."
            className="w-80"
            clearParamsOnChange={["productId"]}
          />
          {productId && (
            <Link href={clearHref} className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Clear
            </Link>
          )}
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {q ? "Select a product from the results below." : "Start typing to search."}
        </div>
      </div>

      {q && !productId && (
        <div className="rounded-2xl border bg-white p-2 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Select</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium text-gray-900">{row.sku}</TableCell>
                  <TableCell className="min-w-0">
                    <div className="truncate text-gray-900">{row.product}</div>
                    <div className="truncate text-xs text-gray-500">{row.brand}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/reports/products?q=${encodeURIComponent(q)}&productId=${row.id}`}
                      className="inline-flex items-center justify-center rounded-md px-2 py-1 text-gray-600 hover:bg-gray-100"
                      aria-label="Open product report"
                    >
                      <IconEye className="h-4 w-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {products.length === 0 && (
                <TableRow>
                  <TableCell className="py-8 text-center text-gray-500" colSpan={3}>
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        {selectedProduct ? (
          <SelectedProductReport selectedProduct={selectedProduct} />
        ) : (
          <div className="text-sm text-gray-600">
            Select a product from the search results to view its full history.
          </div>
        )}
      </div>
    </div>
  );
}
