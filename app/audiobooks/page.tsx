import { Suspense } from "react";
import { AudiobookList } from "@/components/audiobook/audiobook-list";
import { getTopAudiobooks, audiobookCategories } from "@/lib/audiobook-api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

// This is a server component that fetches the initial data
async function AudiobooksContent() {
  try {
    // Fetch top audiobooks for the initial view
    const topAudiobooks = await getTopAudiobooks();

    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Explore Our Audiobooks</h1>
          <p className="text-xl text-muted-foreground">
            Immerse yourself in captivating stories narrated by talented voice
            artists. From bestselling novels to thought-provoking non-fiction,
            our audiobook collection has something for everyone.
          </p>
        </div>

        <Tabs defaultValue="featured" className="mb-12">
          <TabsList className="flex flex-wrap h-auto p-1 mb-8">
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="popular">Popular</TabsTrigger>
            <TabsTrigger value="new">New Releases</TabsTrigger>
            <TabsTrigger value="favorites">My Favorites</TabsTrigger>
          </TabsList>

          <TabsContent value="featured" className="mt-0">
            <AudiobookList
              initialAudiobooks={topAudiobooks}
              title="Featured Audiobooks"
            />
          </TabsContent>

          <TabsContent value="popular" className="mt-0">
            <AudiobookList
              initialAudiobooks={topAudiobooks}
              title="Popular Audiobooks"
            />
          </TabsContent>

          <TabsContent value="new" className="mt-0">
            <AudiobookList
              initialAudiobooks={topAudiobooks}
              title="New Releases"
            />
          </TabsContent>

          <TabsContent value="favorites" className="mt-0">
            <AudiobookList initialAudiobooks={[]} title="My Favorites" />
          </TabsContent>
        </Tabs>

        <div className="space-y-12">
          {Object.entries(audiobookCategories)
            .slice(0, 3)
            .map(([genre, id]) => (
              <section key={id} className="space-y-6">
                <h2 className="text-2xl font-bold">{genre} Audiobooks</h2>
                <AudiobookList
                  initialAudiobooks={topAudiobooks
                    .filter((book: any) =>
                      book.volumeInfo.categories?.some((category: any) =>
                        category.toLowerCase().includes(id.toLowerCase())
                      )
                    )
                    .slice(0, 5)}
                  showSearch={false}
                  showFilters={false}
                  title=""
                />
              </section>
            ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching audiobooks:", error);
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-4 rounded-lg">
          <h2 className="text-lg font-semibold">Error loading audiobooks</h2>
          <p>
            We encountered an issue while loading the audiobook data. Please try
            again later.
          </p>
        </div>
      </div>
    );
  }
}

// Loading skeleton for the audiobooks page
function AudiobooksLoading() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <Skeleton className="h-10 w-64 mx-auto mb-4" />
        <Skeleton className="h-6 w-full max-w-lg mx-auto" />
      </div>

      <Skeleton className="h-10 w-96 mb-8" />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-12">
        {Array(10)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[2/3] w-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
      </div>
    </div>
  );
}

export default function AudiobooksPage() {
  return (
    <Suspense fallback={<AudiobooksLoading />}>
      <AudiobooksContent />
    </Suspense>
  );
}
