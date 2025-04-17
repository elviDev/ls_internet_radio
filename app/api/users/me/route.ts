import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { farewellEmail } from "@/lib/email/farewellEmail";
import { sendEmail } from "@/lib/email/sendEmail";
import { uploadToS3 } from "@/lib/storage/uploadToS3";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();

  const name = formData.get("name")?.toString();
  const file = formData.get("profileImage") as File | null;

  let imageUrl: string | undefined;

  if (file) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const uploadResult = await uploadToS3(
      buffer,
      file.name,
      file.type,
      "profiles"
    );
    imageUrl = uploadResult.url;
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: name || undefined,
      profileImage: imageUrl || undefined,
    },
    select: {
      id: true,
      name: true,
      email: true,
      profileImage: true,
    },
  });

  return NextResponse.json({ success: true, user: updatedUser });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { password } = body;

  if (!password) {
    return NextResponse.json(
      { error: "Password is required" },
      { status: 400 }
    );
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!existingUser || !existingUser.password) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const passwordMatch = await bcrypt.compare(password, existingUser.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 401 }
      );
    }

    const farewellPayload = farewellEmail({ name: existingUser.name! });

    await sendEmail(existingUser.email, farewellPayload);

    await prisma.user.delete({
      where: { id: user.id },
    });

    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("[DELETE_USER]", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
