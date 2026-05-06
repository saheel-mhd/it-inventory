import { NextResponse } from "next/server";
import {
  CurrentAdmin,
  UserRole,
  getActiveSessionStatusUser,
  getCurrentAdmin,
} from "~/server/auth/session";

type RouteHandler<TArgs extends unknown[]> = (...args: TArgs) => Promise<Response>;

export function withApiSession<
  TArgs extends [Request] | [Request, { params: Promise<Record<string, string>> }],
>(handler: RouteHandler<TArgs>): RouteHandler<TArgs> {
  return (async (...args: TArgs) => {
    const user = await getActiveSessionStatusUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }
    return handler(...args);
  }) as RouteHandler<TArgs>;
}

const ROLE_RANK: Record<UserRole, number> = {
  USER: 1,
  MANAGER: 2,
  ADMIN: 3,
};

export function withApiRole<
  TArgs extends [Request] | [Request, { params: Promise<Record<string, string>> }],
>(role: UserRole, handler: RouteHandler<TArgs>): RouteHandler<TArgs> {
  return (async (...args: TArgs) => {
    const actor = await getCurrentAdmin();
    if (!actor) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }
    if (ROLE_RANK[actor.role] < ROLE_RANK[role]) {
      return NextResponse.json(
        { error: `Requires ${role.toLowerCase()} role.` },
        { status: 403 },
      );
    }
    return handler(...args);
  }) as RouteHandler<TArgs>;
}

export const withApiAdmin = <
  TArgs extends [Request] | [Request, { params: Promise<Record<string, string>> }],
>(
  handler: RouteHandler<TArgs>,
) => withApiRole<TArgs>("ADMIN", handler);

export const withApiManager = <
  TArgs extends [Request] | [Request, { params: Promise<Record<string, string>> }],
>(
  handler: RouteHandler<TArgs>,
) => withApiRole<TArgs>("MANAGER", handler);

export type { CurrentAdmin };
