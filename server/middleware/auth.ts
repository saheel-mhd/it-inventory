import { NextResponse } from "next/server";
import { getActiveSessionStatusUser } from "~/server/auth/session";

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
