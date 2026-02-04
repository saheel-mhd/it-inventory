import ConfigureGrid from "~/app/components/settings/configure-grid";
import { prisma } from "~/lib/prisma";

export default async function ConfigurePage() {
  const [categories, assetTypes, departments, warrantyPeriods] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.assetType.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.departmentModel.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.warrantyPeriodModel.findMany({
      orderBy: [{ months: "asc" }, { name: "asc" }],
      select: { id: true, name: true, months: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configure</h1>
        <p className="mt-1 text-sm text-gray-600">
          Configure core master data used across inventory.
        </p>
      </div>
      <ConfigureGrid
        initialCategories={categories}
        initialAssetTypes={assetTypes}
        initialDepartments={departments}
        initialWarrantyPeriods={warrantyPeriods}
      />
    </div>
  );
}
