import StaffClient from "~/app/components/staff/staff-client";
import { prisma } from "~/lib/prisma";

const PAGE_SIZE = 10;

type UsersSearchParams = {
  q?: string | string[];
  page?: string | string[];
};

const getParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] ?? "" : value ?? "";

const getPage = (value: string | string[] | undefined) => {
  const raw = getParam(value);
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams?: Promise<UsersSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const q = getParam(resolvedSearchParams?.q);
  const page = getPage(resolvedSearchParams?.page);

  const departmentMatch = q.trim();

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          ...(departmentMatch
            ? [
                {
                  department: {
                    OR: [
                      { name: { contains: q, mode: "insensitive" as const } },
                      { code: { contains: q, mode: "insensitive" as const } },
                    ],
                  },
                },
              ]
            : []),
        ],
      }
    : {};

  const [staff, total, products, departments] = await prisma.$transaction([
    prisma.staff.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        department: { select: { id: true, name: true, code: true } },
        _count: { select: { inventoryUsing: true } },
        inventoryUsing: {
          orderBy: { startDate: "desc" },
          include: {
            product: { select: { id: true, sku: true, product: true } },
          },
        },
      },
    }),
    prisma.staff.count({ where }),
    prisma.product.findMany({
      where: { status: "AVAILABLE" },
      orderBy: { sku: "asc" },
      select: { id: true, sku: true, product: true },
    }),
    prisma.departmentModel.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const serializedStaff = staff.map((member) => ({
    id: member.id,
    name: member.name,
    department: member.department.name,
    departmentId: member.department.id,
    createdAt: member.createdAt.toISOString(),
    updatedAt: member.updatedAt.toISOString(),
    inventoryUsingCount: member._count.inventoryUsing,
    inventoryUsing: member.inventoryUsing.map((assignment) => ({
      id: assignment.id,
      quantity: assignment.quantity,
      startDate: assignment.startDate.toISOString(),
      returnDate: assignment.returnDate ? assignment.returnDate.toISOString() : null,
      returnReason: assignment.returnReason,
      returnReasonNote: assignment.returnReasonNote,
      product: assignment.product,
    })),
  }));

  return (
    <StaffClient
      staff={serializedStaff}
      totalPages={totalPages}
      currentPage={currentPage}
      q={q}
      products={products}
      departments={departments}
    />
  );
}
