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
      select: { id: true, password: true },
    });

    if (!user) {
      return NextResponse.json({ ok: false, message: "Invalid credentials." }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return NextResponse.json({ ok: false, message: "Invalid credentials." }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("LOGIN API ERROR:", err); // <-- check terminal for this output
    return NextResponse.json(
      { ok: false, message: "Internal Server Error (check server logs)." },
      { status: 500 }
    );
  }
}
