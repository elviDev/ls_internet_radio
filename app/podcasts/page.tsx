import { Suspense } from "react";
import { PodcastList } from "@/components/podcast/podcast-list";
import { getTopPodcasts, podcastGenres } from "@/lib/podcast-api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

// This is a server component that fetches the initial data
async function PodcastsContent() {
  try {
    // Fetch top podcasts for the initial view
    const topPodcasts = await getTopPodcasts();

    // Transform the data to match our component's expected format
    const formattedPodcasts = topPodcasts.map((podcast: any) => ({
      collectionId: podcast.id.attributes["im:id"],
      collectionName: podcast["im:name"].label,
      artistName: podcast["im:artist"].label,
      artworkUrl100: podcast["im:image"][2].label,
      primaryGenreName: podcast.category.attributes.label,
    }));

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
            />
          </TabsContent>

          <TabsContent value="popular" className="mt-0">
            <PodcastList
              initialPodcasts={formattedPodcasts}
              title="Popular Podcasts"
            />
          </TabsContent>

          <TabsContent value="recent" className="mt-0">
            <PodcastList
              initialPodcasts={formattedPodcasts}
              title="Recently Added"
            />
          </TabsContent>

          <TabsContent value="favorites" className="mt-0">
            <PodcastList initialPodcasts={[]} title="My Favorites" />
          </TabsContent>
        </Tabs>

        <div className="space-y-12">
          {Object.entries(podcastGenres)
            .slice(0, 3)
            .map(([genre, id]) => (
              <section key={id} className="space-y-6">
                <h2 className="text-2xl font-bold">{genre} Podcasts</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {formattedPodcasts
                    .filter(
                      (podcast: any) => podcast.primaryGenreName === genre
                    )
                    .slice(0, 4)
                    .map((podcast: any) => (
                      <PodcastList
                        key={podcast.collectionId}
                        initialPodcasts={[podcast]}
                        showSearch={false}
                        showFilters={false}
                        title=""
                      />
                    ))}
                </div>
              </section>
            ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching podcasts:", error);
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-4 rounded-lg">
          <h2 className="text-lg font-semibold">Error loading podcasts</h2>
          <p>
            We encountered an issue while loading the podcast data. Please try
            again later.
          </p>
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
