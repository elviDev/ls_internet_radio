// app/api/admin/users/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminOnly } from "@/lib/auth/adminOnly";
import { farewellEmail } from "@/lib/email/farewellEmail";
import { sendEmail } from "@/lib/email/sendEmail";

export const GET = adminOnly(async (_req, { params }) => {
  const { id } = params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profileImage: true,
      createdAt: true,
      emailVerified: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
});

export const PATCH = adminOnly(async (req, { params }) => {
  const { id } = params;
  const { role } = await req.json();

  if (!["USER", "ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { role },
  });

  return NextResponse.json({
    message: `Role updated to ${role}`,
    user: {
      id: updated.id,
      email: updated.email,
      role: updated.role,
    },
  });
});

export const DELETE = adminOnly(async (_req, { params }) => {
  const { id } = params;

  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await prisma.user.delete({ where: { id } });

  if (user.name) {
    const farewellPayload = farewellEmail({ name: user.name! });

    await sendEmail(user.email, farewellPayload);
  }

  return NextResponse.json({ message: "User deleted successfully" });
});
