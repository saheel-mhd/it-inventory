import ConfigureGrid from "~/app/components/settings/configure-grid";
import { prisma } from "~/lib/prisma";

export default async function ConfigurePage() {
  const [categories, assetTypes, departments, warrantyPeriods] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, prefix: true, isActive: true, assetType: { select: { name: true } } },
    }),
    prisma.assetType.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, isActive: true },
    }),
    prisma.departmentModel.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, isActive: true },
    }),
    prisma.warrantyPeriodModel.findMany({
      orderBy: [{ months: "asc" }, { name: "asc" }],
      select: { id: true, name: true, months: true, isActive: true },
    }),
  ]);

  const serializedCategories = categories.map((category) => ({
    id: category.id,
    name: category.name,
    prefix: category.prefix,
    isActive: category.isActive,
    assetTypeName: category.assetType?.name ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configure</h1>
        <p className="mt-1 text-sm text-gray-600">
          Configure core master data used across inventory.
        </p>
      </div>
      <ConfigureGrid
        initialCategories={serializedCategories}
        initialAssetTypes={assetTypes}
        initialDepartments={departments}
        initialWarrantyPeriods={warrantyPeriods}
      />
    </div>
  );
}
