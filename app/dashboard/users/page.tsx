import StaffClient from "~/app/components/staff/staff-client";
import { prisma } from "~/lib/prisma";

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

type UsersSearchParams = {
  q?: string | string[];
  page?: string | string[];
  departmentId?: string | string[];
  sort?: string | string[];
  pageSize?: string | string[];
  activeState?: string | string[];
};

const getParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] ?? "" : value ?? "";

const getPage = (value: string | string[] | undefined) => {
  const raw = getParam(value);
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

const getPageSize = (value: string | string[] | undefined) => {
  const raw = getParam(value);
  const parsed = Number.parseInt(raw, 10);
  return PAGE_SIZE_OPTIONS.includes(parsed as (typeof PAGE_SIZE_OPTIONS)[number])
    ? parsed
    : 10;
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams?: Promise<UsersSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const q = getParam(resolvedSearchParams?.q);
  const page = getPage(resolvedSearchParams?.page);
  const pageSize = getPageSize(resolvedSearchParams?.pageSize);
  const departmentId = getParam(resolvedSearchParams?.departmentId);
  const sort = getParam(resolvedSearchParams?.sort) || "updated_desc";
  const activeState = getParam(resolvedSearchParams?.activeState) || "active";

  const departmentMatch = q.trim();

  const where = {
    ...(q
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
      : {}),
    ...(departmentId ? { departmentId } : {}),
    ...(activeState === "inactive" ? { isActive: false } : { isActive: true }),
  };

  const orderBy =
    sort === "updated_asc"
      ? ({ updatedAt: "asc" } as const)
      : ({ updatedAt: "desc" } as const);

  const [staff, total, products, departments] = await prisma.$transaction([
    prisma.staff.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
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

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);

  const serializedStaff = staff.map((member) => ({
    id: member.id,
    name: member.name,
    isActive: member.isActive,
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
      departmentId={departmentId}
      sort={sort}
      pageSize={pageSize}
      activeState={activeState}
      products={products}
      departments={departments}
    />
  );
}
