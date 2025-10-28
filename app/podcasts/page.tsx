import { Suspense } from "react";
import { PodcastList } from "@/components/podcast/podcast-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { prisma } from "@/lib/prisma";
import { getFavoritePodcasts } from "@/app/podcasts/actions";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// This is a server component that fetches the initial data
async function PodcastsContent() {
  try {
    // First, let's check if there are any podcasts at all
    const allPodcasts = await prisma.podcast.findMany({
      include: {
        author: { select: { firstName: true, lastName: true } },
        genre: { select: { name: true } },
      }
    });

    // Get current user to check favorites
    const currentUser = await getCurrentUser();
    
    // Fetch podcasts from database
    const [publishedPodcasts, genres, userFavorites] = await Promise.all([
      prisma.podcast.findMany({
        where: { status: "PUBLISHED" },
        include: {
          author: { select: { firstName: true, lastName: true } },
          genre: { select: { name: true } },
          episodes: {
            where: { status: "PUBLISHED" },
            select: { id: true }
          },
          _count: {
            select: { favorites: true }
          }
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.genre.findMany({
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" }
      }),
      currentUser ? prisma.favorite.findMany({
        where: {
          OR: [
            { userId: currentUser.id },
            { staffId: currentUser.id }
          ],
          podcastId: { not: null }
        },
        select: { podcastId: true }
      }) : []
    ]);
    
    // Create a set of favorite podcast IDs for quick lookup
    const favoritePodcastIds = new Set(userFavorites.map(f => f.podcastId));


    // Transform the data to match component's expected format
    const formattedPodcasts = publishedPodcasts.map((podcast: any) => ({
      collectionId: podcast.id,
      collectionName: podcast.title,
      artistName: `${podcast.author.firstName} ${podcast.author.lastName}`,
      artworkUrl100: podcast.coverImage || "/placeholder.svg?height=400&width=400",
      primaryGenreName: podcast.genre?.name,
      episodeCount: podcast.episodes.length,
      favoriteCount: podcast._count.favorites,
      releaseDate: podcast.releaseDate,
      description: podcast.description,
      isFavorite: favoritePodcastIds.has(podcast.id)
    }));

    console.log("Formatted podcasts:", formattedPodcasts.length);
    console.log("Sample formatted podcast:", formattedPodcasts[0]);

    // If no podcasts found, show a helpful message
    if (formattedPodcasts.length === 0) {
      return (
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Explore Our Podcasts</h1>
            <p className="text-xl text-muted-foreground">
              Discover thought-provoking conversations, inspiring stories, and
              expert insights across a variety of topics.
            </p>
          </div>
          
          <div className="text-center py-12">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 p-6 rounded-lg max-w-md mx-auto">
              <h2 className="text-lg font-semibold mb-2">No Podcasts Available</h2>
              <p className="mb-4">
                {allPodcasts.length === 0 
                  ? "No podcasts have been created yet." 
                  : `Found ${allPodcasts.length} podcast(s) but none are published.`
                }
              </p>
              {allPodcasts.length > 0 && (
                <details className="text-left">
                  <summary className="cursor-pointer">View all podcasts status</summary>
                  <pre className="text-xs mt-2 bg-gray-100 dark:bg-gray-800 p-2 rounded">
                    {JSON.stringify(allPodcasts.map(p => ({ title: p.title, status: p.status })), null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Get popular podcasts (by favorite count)
    const popularPodcasts = [...formattedPodcasts].sort((a, b) => b.favoriteCount - a.favoriteCount);

    // Get recent podcasts
    const recentPodcasts = [...formattedPodcasts].sort((a, b) => 
      new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
    );

    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Explore Our Podcasts</h1>
          <p className="text-xl text-muted-foreground">
            Discover thought-provoking conversations, inspiring stories, and
            expert insights across a variety of topics.
          </p>
        </div>

        <Tabs defaultValue="featured" className="mb-12">
          <TabsList className="flex flex-wrap h-auto p-1 mb-8">
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="popular">Popular</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="favorites">My Favorites</TabsTrigger>
          </TabsList>

          <TabsContent value="featured" className="mt-0">
            <PodcastList
              initialPodcasts={formattedPodcasts}
              title="Featured Podcasts"
              availableGenres={genres}
            />
          </TabsContent>

          <TabsContent value="popular" className="mt-0">
            <PodcastList
              initialPodcasts={popularPodcasts}
              title="Popular Podcasts"
              availableGenres={genres}
            />
          </TabsContent>

          <TabsContent value="recent" className="mt-0">
            <PodcastList
              initialPodcasts={recentPodcasts}
              title="Recently Added"
              availableGenres={genres}
            />
          </TabsContent>

          <TabsContent value="favorites" className="mt-0">
            <PodcastList 
              initialPodcasts={[]} 
              title="My Favorites" 
              showFavoritesOnly={true} 
              availableGenres={genres}
            />
          </TabsContent>
        </Tabs>

        <div className="space-y-12">
          {genres.slice(0, 3).map((genre) => {
            const genrePodcasts = formattedPodcasts
              .filter((podcast: any) => podcast.primaryGenreName === genre.name)
              .slice(0, 4);
              
            if (genrePodcasts.length === 0) return null;
            
            return (
              <section key={genre.id} className="space-y-6">
                <h2 className="text-2xl font-bold">{genre.name} Podcasts</h2>
                <PodcastList
                  initialPodcasts={genrePodcasts}
                  showSearch={false}
                  showFilters={false}
                  title=""
                  availableGenres={genres}
                />
              </section>
            );
          })}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in PodcastsContent:", error);
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-4 rounded-lg">
          <h2 className="text-lg font-semibold">Error loading podcasts</h2>
          <p>
            We encountered an issue while loading the podcast data. Please try
            again later.
          </p>
          <details className="mt-2">
            <summary>Error details (for debugging)</summary>
            <pre className="text-xs mt-2 bg-gray-100 dark:bg-gray-800 p-2 rounded">
              {error.message}
            </pre>
          </details>
        </div>
      </div>
    );
  }
}

// Loading skeleton for the podcasts page
function PodcastsLoading() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <Skeleton className="h-10 w-64 mx-auto mb-4" />
        <Skeleton className="h-6 w-full max-w-lg mx-auto" />
      </div>

      <Skeleton className="h-10 w-96 mb-8" />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
        {Array(8)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
      </div>
    </div>
  );
}

export default function PodcastsPage() {
  return (
    <Suspense fallback={<PodcastsLoading />}>
      <PodcastsContent />
    </Suspense>
  );
}
