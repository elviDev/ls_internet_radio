import { NextResponse } from "next/server";
import { getCurrentUser } from "./getCurrentUser";
import { Role } from "@prisma/client";

export function adminOnly(
  handler: (req: Request, context: { params: any }) => Promise<Response>
) {
  return async function (req: Request, context: { params: any }) {
    const user = await getCurrentUser();

    if (!user || user.role !== Role.ADMIN) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    return handler(req, context);
  };
}
