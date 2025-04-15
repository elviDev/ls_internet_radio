import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValid } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim();
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    if (!query) {
      return NextResponse.json(
        { error: "Missing search query" },
        { status: 400 }
      );
    }

    const lowerQuery = query.toLowerCase();

    let dateFilter: Date | null = null;
    if (!isNaN(Date.parse(query))) {
      const parsedDate = new Date(query);
      if (isValid(parsedDate)) {
        dateFilter = parsedDate;
      }
    }

    const audiobooks = await prisma.audiobook.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { author: { contains: query, mode: "insensitive" } },
          { narrator: { contains: query, mode: "insensitive" } },
          { genre: { contains: query, mode: "insensitive" } },
          ...(dateFilter
            ? [
                {
                  releaseDate: {
                    gte: dateFilter,
                    lt: new Date(dateFilter.getTime() + 86400000),
                  },
                },
              ]
            : []),
        ],
      },
      orderBy: { releaseDate: "desc" },
      take: limit,
    });

    return NextResponse.json({ data: audiobooks }, { status: 200 });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json(
      { error: "Failed to search audiobooks" },
      { status: 500 }
    );
  }
}
