import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "~/lib/prisma"; // (or "@/lib/prisma" if alias works)

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body ?? {};

    if (!process.env.DATABASE_URL) {
      // This is the #1 common issue
      return NextResponse.json(
        { ok: false, message: "DATABASE_URL is missing on server (.env not loaded)." },
        { status: 500 }
      );
    }

    if (!username || !password) {
      return NextResponse.json(
        { ok: false, message: "Username and password are required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { name: username },
      select: { id: true, password: true, isActive: true },
    });

    if (!user) {
      return NextResponse.json({ ok: false, message: "Invalid credentials." }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return NextResponse.json({ ok: false, message: "Invalid credentials." }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json(
        { ok: false, message: "Your account is inactive. Contact admin." },
        { status: 403 },
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const response = NextResponse.json({ ok: true });
    const maxAge = 60 * 60 * 24 * 10;
    response.cookies.set({
      name: "session",
      value: user.id,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge,
    });
    return response;
  } catch (err) {
    console.error("LOGIN API ERROR:", err); // <-- check terminal for this output
    return NextResponse.json(
      { ok: false, message: "Internal Server Error (check server logs)." },
      { status: 500 }
    );
  }
}
