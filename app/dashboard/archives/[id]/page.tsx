"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Download,
  Play,
  Pause,
  Heart,
  MessageCircle,
  Share2,
  Calendar,
  Clock,
  User,
  Tag,
  FileText,
  Volume2,
  BarChart3,
  Loader2,
  AlertCircle,
  RefreshCw,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { fetchWithErrorHandling } from "@/lib/utils/network-error-handler";

interface Archive {
  id: string;
  title: string;
  slug: string;
  description: string;
  host: string;
  guests: string;
  category: string;
  type: string;
  status: string;
  duration: number;
  fileSize: number;
  playCount: number;
  downloadCount: number;
  likeCount: number;
  shareCount: number;
  audioFile: string;
  downloadUrl: string;
  coverImage: string;
  thumbnailImage: string;
  originalAirDate: string;
  archivedDate: string;
  isDownloadable: boolean;
  isFeatured: boolean;
  isExclusive: boolean;
  accessLevel: string;
  tags: string[];
  metadata: any;
  transcript: string;
  transcriptFile: string;
  qualityVariants: any[];
  createdAt: string;
  updatedAt: string;
  createdBy: {
    firstName: string;
    lastName: string;
    email: string;
  };
  curatedBy?: {
    firstName: string;
    lastName: string;
  };
  stats: {
    commentsCount: number;
    favoritesCount: number;
    progressCount: number;
    bookmarksCount: number;
    reviewsCount: number;
  };
  comments: any[];
  favorites: any[];
}

export default function ArchiveDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [archive, setArchive] = useState<Archive | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchArchive();
  }, [params.id]);

  const fetchArchive = async (isRetry = false) => {
    if (isRetry) {
      setRetrying(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await fetchWithErrorHandling(
        `/api/admin/archives/${params.id}`,
        {
          timeout: 30000,
          retries: isRetry ? 0 : 2,
          context: "Loading archive details"
        }
      );
      setArchive(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching archive:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch archive details";
      setError(errorMessage);
      if (!isRetry) {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  const handleRetry = () => {
    fetchArchive(true);
  };

  const handleDelete = async () => {
    const archiveTitle = archive?.title || 'archive';
    setDeleting(true);
    try {
      await fetchWithErrorHandling(
        `/api/admin/archives/${params.id}`,
        {
          method: "DELETE",
          timeout: 15000,
          retries: 1,
          context: `Deleting archive "${archiveTitle}"`
        }
      );
      toast.success(`Archive "${archiveTitle}" deleted successfully`);
      router.push("/dashboard/archives");
    } catch (error) {
      console.error("Error deleting archive:", error);
      const errorMessage = error instanceof Error ? error.message : `Failed to delete archive "${archiveTitle}"`;
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      case "featured":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "public":
        return "bg-green-100 text-green-800";
      case "members_only":
        return "bg-orange-100 text-orange-800";
      case "staff_only":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Archive Details</h3>
          <p className="text-gray-600">Please wait while we fetch the archive information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-6">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Archive</h3>
          <p className="text-gray-600 mb-6 max-w-md">{error}</p>
          <div className="flex space-x-3 justify-center">
            <Button 
              onClick={handleRetry} 
              disabled={retrying}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${retrying ? 'animate-spin' : ''}`} />
              <span>{retrying ? 'Retrying...' : 'Try Again'}</span>
            </Button>
            <Link href="/dashboard/archives">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Archives
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!archive) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Archive Not Found</h1>
        <p className="text-gray-600 mb-6">The requested archive could not be found.</p>
        <Link href="/dashboard/archives">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Archives
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/archives">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{archive.title}</h1>
            <p className="text-gray-600">Archive Details</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link href={`/dashboard/archives/${archive.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Archive</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this archive? This action cannot be undone.
                  All associated comments, favorites, and progress data will also be deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700 flex items-center space-x-2"
                >
                  {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{deleting ? "Deleting..." : "Delete"}</span>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Archive Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Archive Information</CardTitle>
                <div className="flex space-x-2">
                  <Badge className={getStatusColor(archive.status)}>
                    {archive.status}
                  </Badge>
                  <Badge className={getAccessLevelColor(archive.accessLevel)}>
                    {archive.accessLevel.replace("_", " ")}
                  </Badge>
                  {archive.isFeatured && (
                    <Badge variant="secondary">Featured</Badge>
                  )}
                  {archive.isExclusive && (
                    <Badge variant="outline">Exclusive</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {archive.coverImage && (
                <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={archive.coverImage}
                    alt={archive.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700">{archive.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Host</h4>
                  <p className="text-gray-600">{archive.host}</p>
                </div>
                {archive.guests && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Guests</h4>
                    <p className="text-gray-600">{archive.guests}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Category</h4>
                  <p className="text-gray-600">{archive.category}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Type</h4>
                  <p className="text-gray-600">{archive.type}</p>
                </div>
              </div>

              {archive.tags && archive.tags.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {archive.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs for additional content */}
          <Tabs defaultValue="transcript" className="w-full">
            <TabsList>
              <TabsTrigger value="transcript">Transcript</TabsTrigger>
              <TabsTrigger value="comments">Comments ({archive.stats.commentsCount})</TabsTrigger>
              <TabsTrigger value="favorites">Favorites ({archive.stats.favoritesCount})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="transcript" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Transcript
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {archive.transcript ? (
                    <div className="prose max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">
                        {archive.transcript}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No transcript available</p>
                  )}
                  {archive.transcriptFile && (
                    <div className="mt-4">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download Transcript File
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Recent Comments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {archive.comments && archive.comments.length > 0 ? (
                    <div className="space-y-4">
                      {archive.comments.map((comment, index) => (
                        <div key={index} className="border-b pb-4 last:border-b-0">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium">{comment.user?.name || "Anonymous"}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <p className="text-gray-700">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No comments yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="favorites" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Heart className="h-5 w-5 mr-2" />
                    Recent Favorites
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {archive.favorites && archive.favorites.length > 0 ? (
                    <div className="space-y-4">
                      {archive.favorites.map((favorite, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <p className="font-medium">
                            {favorite.user?.name || favorite.staff?.firstName + " " + favorite.staff?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(favorite.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No favorites yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* File Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Volume2 className="h-5 w-5 mr-2" />
                Audio File
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {archive.audioFile && (
                <audio controls className="w-full">
                  <source src={archive.audioFile} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              )}
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Duration</span>
                  <span className="text-sm font-medium">
                    {formatDuration(archive.duration)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">File Size</span>
                  <span className="text-sm font-medium">
                    {formatFileSize(archive.fileSize)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Downloadable</span>
                  <span className="text-sm font-medium">
                    {archive.isDownloadable ? "Yes" : "No"}
                  </span>
                </div>
              </div>

              {archive.isDownloadable && archive.downloadUrl && (
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Audio
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Plays</span>
                <span className="text-sm font-medium">{archive.playCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Downloads</span>
                <span className="text-sm font-medium">{archive.downloadCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Likes</span>
                <span className="text-sm font-medium">{archive.likeCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Shares</span>
                <span className="text-sm font-medium">{archive.shareCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Comments</span>
                <span className="text-sm font-medium">{archive.stats.commentsCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Favorites</span>
                <span className="text-sm font-medium">{archive.stats.favoritesCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Progress Tracking</span>
                <span className="text-sm font-medium">{archive.stats.progressCount}</span>
              </div>
            </CardContent>
          </Card>

          {/* Dates & Creator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {archive.originalAirDate && (
                <div>
                  <span className="text-sm text-gray-600">Original Air Date</span>
                  <p className="text-sm font-medium">
                    {new Date(archive.originalAirDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              <div>
                <span className="text-sm text-gray-600">Archived Date</span>
                <p className="text-sm font-medium">
                  {new Date(archive.archivedDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Created</span>
                <p className="text-sm font-medium">
                  {new Date(archive.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Last Updated</span>
                <p className="text-sm font-medium">
                  {new Date(archive.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <Separator />
              <div>
                <span className="text-sm text-gray-600">Created By</span>
                <p className="text-sm font-medium">
                  {archive.createdBy.firstName} {archive.createdBy.lastName}
                </p>
                <p className="text-xs text-gray-500">{archive.createdBy.email}</p>
              </div>
              {archive.curatedBy && (
                <div>
                  <span className="text-sm text-gray-600">Curated By</span>
                  <p className="text-sm font-medium">
                    {archive.curatedBy.firstName} {archive.curatedBy.lastName}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}