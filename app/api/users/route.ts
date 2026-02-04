import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";

type Payload = {
  name?: string;
  email?: string;
  password?: string;
  isActive?: boolean;
};

const isEmailValid = (value: string) => /^\S+@\S+\.\S+$/.test(value);

export async function POST(request: Request) {
  const body = (await request.json()) as Payload;
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  const isActive = Boolean(body.isActive);

  if (!name) {
    return NextResponse.json({ error: "Username is required." }, { status: 400 });
  }
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }
  if (!isEmailValid(email)) {
    return NextResponse.json({ error: "Email format is invalid." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  try {
    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hash,
        isActive,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Username or email already exists." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
  }
}
