import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [podcasts, genres] = await Promise.all([
      prisma.podcast.findMany({
        include: {
          author: { select: { firstName: true, lastName: true } },
          genre: { select: { name: true } },
          episodes: {
            select: { id: true, status: true, title: true }
          },
          _count: {
            select: { favorites: true }
          }
        }
      }),
      prisma.genre.findMany()
    ]);

    return NextResponse.json({
      totalPodcasts: podcasts.length,
      totalGenres: genres.length,
      podcasts: podcasts.map(p => ({
        id: p.id,
        title: p.title,
        status: p.status,
        author: `${p.author.firstName} ${p.author.lastName}`,
        genre: p.genre?.name,
        episodeCount: p.episodes.length,
        favoriteCount: p._count.favorites,
        episodes: p.episodes
      })),
      genres: genres.map(g => ({
        id: g.id,
        name: g.name,
        slug: g.slug
      }))
    });
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}