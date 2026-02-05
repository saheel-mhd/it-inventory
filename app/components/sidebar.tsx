import Link from "next/link";
import LogoutButton from "~/app/components/logout-button";
import {
  IconAccount,
  IconHome,
  IconInventory,
  IconReport,
  IconSettings,
  IconUsers,
} from "~/app/components/ui/icons";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: IconHome },
  { label: "Inventory", href: "/dashboard/inventory", icon: IconInventory },
  { label: "Staff", href: "/dashboard/users", icon: IconUsers },
  { label: "Reports", href: "/dashboard/reports", icon: IconReport },
];

const secondaryItems = [
  { label: "Settings", href: "/dashboard/settings", icon: IconSettings },
  { label: "Account", href: "/dashboard/account", icon: IconAccount },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-60 border-r border-gray-300 bg-gray-50 p-4 shadow-sm">
      <div className="flex h-full flex-col">
        <div className="mb-6 rounded-lg border border-gray-300 bg-gray-200 px-3 py-2 text-lg font-extrabold text-gray-800 font-nav tracking-wide shadow-sm">
          Inventory System
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="font-nav flex items-center gap-3 rounded-md border border-transparent px-3 py-2 text-sm font-medium text-gray-800 transition hover:border-gray-300 hover:bg-gray-200 hover:text-gray-900"
              >
                <Icon className="h-4 w-4 text-gray-600" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-gray-200 pt-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Preferences
          </div>
          <nav className="space-y-1">
            {secondaryItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                key={item.href}
                href={item.href}
                  className="font-nav flex items-center gap-3 rounded-md border border-transparent px-3 py-2 text-sm font-medium text-gray-800 transition hover:border-gray-300 hover:bg-gray-200 hover:text-gray-900"
                >
                  <Icon className="h-4 w-4 text-gray-600" />
                  {item.label}
                </Link>
              );
            })}
            <LogoutButton />
          </nav>
        </div>
      </div>
    </aside>
  );
}
