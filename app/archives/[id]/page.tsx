import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getArchiveById } from "@/app/archives/actions";
import { ArchivePlayer } from "@/components/archives/archive-player";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Download, Heart, Share2, User, Users } from "lucide-react";

interface ArchivePageProps {
  params: Promise<{
    id: string;
  }>;
}

async function ArchiveContent({ id }: { id: string }) {
  try {
    const result = await getArchiveById(id);

    if (!result.success) {
      notFound();
    }

    const archive = result.data;

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="md:col-span-1">
              <div className="relative aspect-square rounded-lg overflow-hidden">
                <img
                  src={archive.image}
                  alt={archive.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div>
                <Badge className="mb-2 bg-brand-600 text-white">
                  {archive.category}
                </Badge>
                <h1 className="text-3xl font-bold mb-2">{archive.title}</h1>
                <div className="flex items-center gap-4 text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{archive.host}</span>
                  </div>
                  {archive.guests && (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{archive.guests}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{archive.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{archive.duration}</span>
                </div>
                {archive.playCount && (
                  <div>
                    <span>{archive.playCount.toLocaleString()} plays</span>
                  </div>
                )}
              </div>

              <p className="text-lg text-muted-foreground leading-relaxed">
                {archive.description}
              </p>

              <div className="flex flex-wrap gap-2">
                <Button className="bg-brand-600 hover:bg-brand-700">
                  Play Archive
                </Button>
                {archive.isDownloadable && (
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}
                <Button variant="outline">
                  <Heart className="h-4 w-4 mr-2" />
                  Add to Favorites
                </Button>
                <Button variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>

          {/* Audio Player Section */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <ArchivePlayer archive={archive} />
            </CardContent>
          </Card>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Transcript Section */}
            {archive.transcript && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Transcript</h3>
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-muted-foreground leading-relaxed">
                      {archive.transcript}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Metadata Section */}
            {archive.metadata && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Details</h3>
                  <div className="space-y-2">
                    {archive.metadata.quality && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Quality:</span>
                        <span>{archive.metadata.quality}</span>
                      </div>
                    )}
                    {archive.metadata.fileSize && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">File Size:</span>
                        <span>{archive.metadata.fileSize}</span>
                      </div>
                    )}
                    {archive.metadata.format && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Format:</span>
                        <span>{archive.metadata.format}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="capitalize">{archive.type}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Tags Section */}
          {archive.tags && archive.tags.length > 0 && (
            <Card className="mt-8">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {archive.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments Section - Placeholder */}
          <Card className="mt-8">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Comments</h3>
              <div className="text-center py-8 text-muted-foreground">
                <p>Comments coming soon!</p>
                <p className="text-sm mt-2">
                  Share your thoughts about this archive with the community.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading archive:", error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Error Loading Archive</h2>
                <p className="text-muted-foreground">
                  We encountered an issue while loading this archive. Please try again later.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
}

function ArchiveLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="md:col-span-1">
            <Skeleton className="aspect-square rounded-lg" />
          </div>
          <div className="md:col-span-2 space-y-4">
            <div>
              <Skeleton className="h-6 w-20 mb-2" />
              <Skeleton className="h-8 w-full mb-2" />
              <div className="flex gap-4 mb-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="flex gap-6">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-20 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>
        <Skeleton className="h-32 w-full mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

export default async function ArchivePage({ params }: ArchivePageProps) {
  const { id } = await params;
  
  return (
    <Suspense fallback={<ArchiveLoading />}>
      <ArchiveContent id={id} />
    </Suspense>
  );
}