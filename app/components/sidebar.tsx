import Link from "next/link";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Inventory", href: "/dashboard/inventory" },
  { label: "Staff", href: "/dashboard/users" },
  { label: "Reports", href: "/dashboard/reports" },
];

export default function Sidebar() {
  return (
    <aside className="min-h-screen w-60 border-r border-gray-200 bg-gray-50 p-4">
      <div className="mb-6 text-lg font-extrabold text-gray-900">
        Inventory System
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 hover:text-gray-900"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
