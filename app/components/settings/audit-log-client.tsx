"use client";

import { useState } from "react";
import { apiFetch } from "~/lib/api-fetch";

type AuditItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorUserId: string;
  actorName: string;
  summary: string | null;
  createdAt: string;
};

type Props = { initialItems: AuditItem[] };

export default function AuditLogClient({ initialItems }: Props) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [hasMore, setHasMore] = useState(initialItems.length === 50);

  const search = async () => {
    setBusy(true);
    try {
      const url = new URL("/api/audit-log", window.location.origin);
      if (query.trim()) url.searchParams.set("q", query.trim());
      url.searchParams.set("size", "50");
      const response = await apiFetch(url.toString());
      const payload = (await response.json()) as {
        items: AuditItem[];
        nextCursor: string | null;
      };
      setItems(payload.items);
      setHasMore(Boolean(payload.nextCursor));
    } finally {
      setBusy(false);
    }
  };

  const loadMore = async () => {
    if (!items.length) return;
    setBusy(true);
    try {
      const lastId = items[items.length - 1].id;
      const url = new URL("/api/audit-log", window.location.origin);
      url.searchParams.set("cursor", lastId);
      url.searchParams.set("size", "50");
      if (query.trim()) url.searchParams.set("q", query.trim());
      const response = await apiFetch(url.toString());
      const payload = (await response.json()) as {
        items: AuditItem[];
        nextCursor: string | null;
      };
      setItems((prev) => [...prev, ...payload.items]);
      setHasMore(Boolean(payload.nextCursor));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search actor name or summary…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") search();
          }}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={search}
          disabled={busy}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          Search
        </button>
      </div>

      <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-700">When</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Actor</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Action</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Entity</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Summary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((row) => (
              <tr key={row.id}>
                <td className="whitespace-nowrap px-3 py-2 text-gray-600">
                  {new Date(row.createdAt).toLocaleString()}
                </td>
                <td className="px-3 py-2 text-gray-900">{row.actorName}</td>
                <td className="px-3 py-2 font-mono text-xs text-gray-700">
                  {row.action}
                </td>
                <td className="px-3 py-2 text-gray-700">
                  {row.entityType}
                  {row.entityId ? (
                    <span className="ml-1 text-xs text-gray-400">
                      ({row.entityId.slice(0, 8)})
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2 text-gray-700">{row.summary ?? "—"}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                  No audit entries.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={busy}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            {busy ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
