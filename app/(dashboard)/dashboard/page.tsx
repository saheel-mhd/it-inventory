import { prisma } from "~/lib/prisma";

const currencyFormatter = new Intl.NumberFormat("en-AE", {
  style: "currency",
  currency: "AED",
  maximumFractionDigits: 0,
});

const formatMoney = (value: number) => currencyFormatter.format(value);

type CategoryStats = {
  id: string;
  name: string;
  inventoryCount: number;
  inUseCount: number;
  inServiceCount: number;
  damagedCount: number;
  value: number;
};

export default async function DashboardPage() {
  const [staffCount, products, categories] = await Promise.all([
    prisma.staff.count(),
    prisma.product.findMany({
      select: {
        id: true,
        status: true,
        cost: true,
        categoryId: true,
      },
    }),
    prisma.category.findMany({ select: { id: true, name: true } }),
  ]);

  const categoryMap = new Map<string, CategoryStats>();
  categories.forEach((category) => {
    categoryMap.set(category.id, {
      id: category.id,
      name: category.name,
      inventoryCount: 0,
      inUseCount: 0,
      inServiceCount: 0,
      damagedCount: 0,
      value: 0,
    });
  });

  let totalInventoryValue = 0;
  let totalDamagedValue = 0;

  products.forEach((product) => {
    const costValue = product.cost ? Number(product.cost) : 0;
    const stats = categoryMap.get(product.categoryId);

    if (product.status === "DAMAGED") {
      totalDamagedValue += costValue;
      if (stats) stats.damagedCount += 1;
    } else {
      totalInventoryValue += costValue;
      if (stats) stats.value += costValue;

      if (product.status === "AVAILABLE" || product.status === "SERVICEABLE") {
        if (stats) stats.inventoryCount += 1;
      } else if (product.status === "ACTIVE_USE") {
        if (stats) stats.inUseCount += 1;
      } else if (product.status === "UNDER_SERVICE") {
        if (stats) stats.inServiceCount += 1;
      }
    }
  });

  const categoryStats = Array.from(categoryMap.values());

  return (
    <main className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Overview of inventory health and usage.
          </p>
        </div>
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-600">Total Staff</div>
          <div className="mt-1 text-3xl font-bold text-gray-900">{staffCount}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-600">Total Inventory Value</div>
          <div className="mt-1 text-3xl font-bold text-gray-900">
            {formatMoney(totalInventoryValue)}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Excludes damaged items.
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-600">Total Damaged Value</div>
          <div className="mt-1 text-3xl font-bold text-gray-900">
            {formatMoney(totalDamagedValue)}
          </div>
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <div className="text-base font-semibold text-gray-900">Category Overview</div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categoryStats.map((category) => (
            <div
              key={category.id}
              className="rounded-2xl border bg-white p-4 shadow-sm"
            >
              <div className="text-sm font-semibold text-gray-900">
                {category.name}
              </div>
              <div className="mt-3 grid gap-3 text-sm text-gray-700 sm:grid-cols-2">
                <div className="rounded-lg bg-gray-50 px-3 py-2">
                  <div className="text-xs uppercase text-gray-400">
                    In Inventory
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {category.inventoryCount}
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-2">
                  <div className="text-xs uppercase text-gray-400">In Use</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {category.inUseCount}
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-2">
                  <div className="text-xs uppercase text-gray-400">In Service</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {category.inServiceCount}
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-2">
                  <div className="text-xs uppercase text-gray-400">Damaged</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {category.damagedCount}
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                Total value (excluding damaged):{" "}
                <span className="font-semibold text-gray-900">
                  {formatMoney(category.value)}
                </span>
              </div>
            </div>
          ))}
          {categoryStats.length === 0 && (
            <div className="rounded-2xl border bg-white p-6 text-sm text-gray-600">
              No categories available.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
