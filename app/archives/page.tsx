import { Suspense } from "react";
import { ArchivesList } from "@/components/archives/archives-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { getArchives, getArchiveCategories } from "@/app/archives/actions";

// This is a server component that fetches the initial data
async function ArchivesContent() {
  try {
    // Fetch archives and categories from database
    const [archivesResult, categoriesResult] = await Promise.all([
      getArchives(),
      getArchiveCategories(),
    ]);

    if (!archivesResult.success) {
      throw new Error(archivesResult.error);
    }

    const archives = archivesResult.data;
    const categories = categoriesResult.success ? categoriesResult.data : [];

    console.log("Found archives:", archives.length);
    console.log("Found categories:", categories.length);

    // If no archives found, show a helpful message
    if (archives.length === 0) {
      return (
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Audio Archives</h1>
            <p className="text-xl text-muted-foreground">
              Access our complete library of past broadcasts, podcasts, and
              audiobooks.
            </p>
          </div>
          
          <div className="text-center py-12">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 p-6 rounded-lg max-w-md mx-auto">
              <h2 className="text-lg font-semibold mb-2">No Archives Available</h2>
              <p className="mb-4">No archived content has been created yet.</p>
            </div>
          </div>
        </div>
      );
    }

    // Filter archives by type
    const podcastArchives = archives.filter((item) => item.type === "podcast");
    const broadcastArchives = archives.filter((item) => item.type === "broadcast");
    const audiobookArchives = archives.filter((item) => item.type === "audiobook");

    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Audio Archives</h1>
          <p className="text-xl text-muted-foreground">
            Access our complete library of past broadcasts, podcasts, and
            audiobooks.
          </p>
        </div>

        <Tabs defaultValue="all" className="mb-12">
          <TabsList className="flex flex-wrap h-auto p-1 mb-8">
            <TabsTrigger value="all" className="mb-1">
              All
            </TabsTrigger>
            <TabsTrigger value="podcasts" className="mb-1">
              Podcasts
            </TabsTrigger>
            <TabsTrigger value="broadcasts" className="mb-1">
              Past Broadcasts
            </TabsTrigger>
            <TabsTrigger value="audiobooks" className="mb-1">
              Audiobooks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            <ArchivesList
              initialArchives={archives}
              title="All Archives"
              availableCategories={categories}
            />
          </TabsContent>

          <TabsContent value="podcasts" className="mt-0">
            <ArchivesList
              initialArchives={podcastArchives}
              title="Podcast Archives"
              availableCategories={categories}
              viewMode="grid"
            />
          </TabsContent>

          <TabsContent value="broadcasts" className="mt-0">
            <ArchivesList
              initialArchives={broadcastArchives}
              title="Broadcast Archives"
              availableCategories={categories}
              viewMode="list"
            />
          </TabsContent>

          <TabsContent value="audiobooks" className="mt-0">
            <ArchivesList
              initialArchives={audiobookArchives}
              title="Audiobook Archives"
              availableCategories={categories}
              viewMode="horizontal"
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  } catch (error) {
    console.error("Error in ArchivesContent:", error);
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-4 rounded-lg">
          <h2 className="text-lg font-semibold">Error loading archives</h2>
          <p>
            We encountered an issue while loading the archive data. Please try
            again later.
          </p>
          <details className="mt-2">
            <summary>Error details (for debugging)</summary>
            <pre className="text-xs mt-2 bg-gray-100 dark:bg-gray-800 p-2 rounded">
              {error instanceof Error ? error.message : "Unknown error"}
            </pre>
          </details>
        </div>
      </div>
    );
  }
}

// Loading skeleton for the archives page
function ArchivesLoading() {
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

export default function ArchivesPage() {
  return (
    <Suspense fallback={<ArchivesLoading />}>
      <ArchivesContent />
    </Suspense>
  );
}
