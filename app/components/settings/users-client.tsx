"use client";

import { useEffect, useState } from "react";
import AddUserModal from "~/app/components/settings/add-user-modal";
import EditUserModal from "~/app/components/settings/edit-user-modal";
import { IconBan, IconCheck, IconPencil } from "~/app/components/ui/icons";
import LiveSearchInput from "~/app/components/ui/live-search-input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/app/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/app/components/ui/table";

type UserRow = {
  id: string;
  name: string;
  email: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
};

type UsersSettingsClientProps = {
  users: UserRow[];
  q: string;
  currentPage: number;
  totalPages: number;
};

export default function UsersSettingsClient({
  users: initialUsers,
  q,
  currentPage,
  totalPages,
}: UsersSettingsClientProps) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [editUser, setEditUser] = useState<UserRow | null>(null);

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const pageHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    params.set("page", String(nextPage));
    return `/settings/users?${params.toString()}`;
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage application login users.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <AddUserModal />
        <LiveSearchInput
          defaultValue={q}
          placeholder="Search username..."
          className="w-80"
        />
      </div>

      <div className="rounded-xl border bg-white p-2 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium text-gray-900">{user.name}</TableCell>
                <TableCell>{user.email ?? "-"}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell>
                  {user.lastLogin ?? "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-md px-2 py-1 text-gray-700 hover:bg-gray-100"
                      onClick={() => setEditUser(user)}
                      aria-label="Edit user"
                    >
                      <IconPencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className={`inline-flex items-center justify-center rounded-md px-2 py-1 ${
                        user.isActive
                          ? "text-red-700 hover:bg-red-50"
                          : "text-green-700 hover:bg-green-50"
                      }`}
                      onClick={async () => {
                        const nextActive = !user.isActive;
                        const response = await fetch(`/api/users/${user.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ isActive: nextActive }),
                        });
                        if (!response.ok) return;
                        setUsers((prev) =>
                          prev.map((item) =>
                            item.id === user.id ? { ...item, isActive: nextActive } : item,
                          ),
                        );
                      }}
                      aria-label={user.isActive ? "Disable user" : "Activate user"}
                    >
                      {user.isActive ? (
                        <IconBan className="h-4 w-4" />
                      ) : (
                        <IconCheck className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell className="py-8 text-center text-gray-500" colSpan={5}>
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href={pageHref(Math.max(1, currentPage - 1))} />
          </PaginationItem>
          {Array.from({ length: totalPages }, (_, index) => {
            const pageNumber = index + 1;
            return (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  href={pageHref(pageNumber)}
                  isActive={pageNumber === currentPage}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            );
          })}
          <PaginationItem>
            <PaginationNext href={pageHref(Math.min(totalPages, currentPage + 1))} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <EditUserModal
        open={Boolean(editUser)}
        user={editUser}
        onClose={() => setEditUser(null)}
        onSaved={(updatedUser) => {
          setUsers((prev) =>
            prev.map((user) =>
              user.id === updatedUser.id
                ? {
                    ...user,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    isActive: updatedUser.isActive,
                  }
                : user,
            ),
          );
        }}
      />
    </div>
  );
}
