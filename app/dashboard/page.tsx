import { prisma } from "~/lib/prisma"; // adjust if your folder differs

export default async function DashboardPage() {
  const totalUsers = await prisma.user.count();

  const recentUsers = await prisma.user.findMany({
    take: 5,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return (
    <main className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Overview of users and recent activity.
          </p>
        </div>
      </div>

      {/* KPI */}
      <section className="mt-6">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-600">Total Users</div>
          <div className="mt-1 text-3xl font-bold">{totalUsers}</div>
        </div>
      </section>

      {/* Recent users */}
      <section className="mt-8">
        <h2 className="text-base font-semibold">Recently Updated Users</h2>

        <div className="mt-3 overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Last Login
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Updated
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {recentUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {u.name}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {new Date(u.updatedAt).toLocaleString()}
                  </td>
                </tr>
              ))}

              {recentUsers.length === 0 && (
                <tr>
                  <td className="px-4 py-3 text-gray-600" colSpan={3}>
                    No users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
