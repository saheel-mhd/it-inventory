import InventoryClient from "~/app/components/inventory/client";
import { prisma } from "~/lib/prisma";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE_USE: "Active Use",
  AVAILABLE: "Available",
  SERVICEABLE: "Serviceable",
  DAMAGED: "Damaged",
  UNDER_SERVICE: "Under Service",
};

const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export default async function InventoryPage() {
  const [products, categories, assetTypes, staffOptions, assignProducts] =
    await Promise.all([
    prisma.product.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        category: true,
        assetType: true,
        staffAssignments: {
          where: { returnDate: null },
          orderBy: { startDate: "desc" },
          take: 1,
          include: { staff: true },
        },
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.assetType.findMany({ orderBy: { name: "asc" } }),
    prisma.staff.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.product.findMany({
      where: { status: "AVAILABLE" },
      orderBy: { sku: "asc" },
      select: { id: true, sku: true, product: true },
    }),
  ]);

  const serializedProducts = products
    .map((product) => {
      const { staffAssignments, ...rest } = product;
      const latestAssignment = staffAssignments[0];
      const assignedName =
        rest.assignedTo ?? latestAssignment?.staff?.name ?? null;
      const activeAssignmentId = latestAssignment?.id ?? null;
      const status =
        assignedName && rest.status === "AVAILABLE" ? "ACTIVE_USE" : rest.status;

      return {
        ...rest,
        assignedTo: assignedName,
        activeAssignmentId,
        status,
      };
    })
    .map((product) => ({
      ...product,
      cost: product.cost ? product.cost.toString() : null,
      orderedDate: product.orderedDate ? product.orderedDate.toISOString() : null,
      warrantyExpire: product.warrantyExpire
        ? product.warrantyExpire.toISOString()
        : null,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    }));

  return (
    <InventoryClient
      initialProducts={serializedProducts}
      categories={categories}
      assetTypes={assetTypes}
      statusOptions={STATUS_OPTIONS}
      staffOptions={staffOptions}
      assignProducts={assignProducts}
    />
  );
}
