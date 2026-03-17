"use client";

import { useRouter } from "next/navigation";
import { IconLogout } from "~/app/components/ui/icons";

type LogoutButtonProps = {
  className?: string;
};

export default function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter();

  const onLogout = () => {
    fetch("/api/logout", { method: "POST" })
      .catch(() => null)
      .finally(() => {
        router.replace("/login");
      });
  };

  return (
    <button
      type="button"
      onClick={onLogout}
      className={
        className ??
        "font-nav flex w-full items-center gap-3 rounded-md border border-transparent px-3 py-2 text-sm font-medium text-gray-800 transition hover:border-gray-300 hover:bg-gray-200 hover:text-gray-900"
      }
    >
      <IconLogout className="h-4 w-4 text-gray-600" />
      Logout
    </button>
  );
}
