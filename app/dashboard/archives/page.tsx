"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { fetchWithErrorHandling, NetworkErrorHandler } from "@/lib/utils/network-error-handler";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Play,
  Download,
  Edit,
  Trash2,
  Archive,
  Upload,
  Eye,
  BarChart3,
  Calendar,
  Clock,
  Users,
  AlertCircle,
  RefreshCw,
  FileX,
  Loader2,
  WifiOff,
  Database,
} from "lucide-react";

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
  };
}

interface ArchiveStats {
  totalArchives: number;
  totalPlays: number;
  totalDownloads: number;
  totalStorageUsed: number;
  averageDuration: number;
  featuredCount: number;
  thisMonthUploads: number;
  mostPopularType: string;
}

interface ArchiveResponse {
  archives: Archive[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: ArchiveStats;
}

export default function ArchivesManagePage() {
  const router = useRouter();
  // Using sonner toast

  // State management
  const [archives, setArchives] = useState<Archive[]>([]);
  const [stats, setStats] = useState<ArchiveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [featuringId, setFeaturingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Load data from API
  const loadData = async (isRetry = false) => {
    if (isRetry) {
      setRetrying(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(typeFilter !== "all" && { type: typeFilter }),
      });

      const data: ArchiveResponse = await fetchWithErrorHandling(
        `/api/admin/archives?${params}`,
        {
          timeout: 30000,
          retries: isRetry ? 0 : 2,
          context: "Loading archives"
        }
      );
      
      setArchives(data.archives);
      setStats(data.stats);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
      setError(null);
    } catch (error) {
      console.error("Error loading archives:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load archives";
      setError(errorMessage);
      if (!isRetry) {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, statusFilter, typeFilter, searchTerm]);

  const handleRetry = () => {
    loadData(true);
  };

  // Archives are already filtered by the API
  const filteredArchives = archives;

  // Helper functions
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "FEATURED":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "ACTIVE":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "ARCHIVED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "HIDDEN":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "PODCAST":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "BROADCAST":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "AUDIOBOOK":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "SHOW":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "MUSIC":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200";
      case "DOCUMENTARY":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
      case "INTERVIEW":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "NEWS":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const handleCreateArchive = () => {
    router.push("/dashboard/archives/new");
  };

  const handleEditArchive = (id: string) => {
    router.push(`/dashboard/archives/${id}/edit`);
  };

  const handleDeleteArchive = async (id: string) => {
    if (confirm("Are you sure you want to delete this archive? This action cannot be undone.")) {
      const archiveToDelete = archives.find(a => a.id === id);
      const archiveTitle = archiveToDelete?.title || 'archive';
      
      setDeletingId(id);
      try {
        await fetchWithErrorHandling(
          `/api/admin/archives/${id}`,
          {
            method: "DELETE",
            timeout: 15000,
            retries: 1,
            context: `Deleting archive "${archiveTitle}"`
          }
        );

        // Remove from local state
        setArchives(archives.filter(archive => archive.id !== id));
        setTotal(total - 1);
        
        toast.success(`Archive "${archiveTitle}" deleted successfully`);
      } catch (error) {
        console.error("Error deleting archive:", error);
        const errorMessage = error instanceof Error ? error.message : `Failed to delete archive "${archiveTitle}"`;
        toast.error(errorMessage);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleToggleFeatured = async (id: string) => {
    const archive = archives.find(a => a.id === id);
    if (!archive) return;

    const archiveTitle = archive.title || 'archive';
    const action = !archive.isFeatured ? 'featuring' : 'unfeaturing';

    setFeaturingId(id);
    try {
      const updatedData = {
        isFeatured: !archive.isFeatured,
        status: archive.isFeatured ? "ACTIVE" : "FEATURED"
      };

      await fetchWithErrorHandling(
        `/api/admin/archives/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedData),
          timeout: 15000,
          retries: 2,
          context: `${action.charAt(0).toUpperCase() + action.slice(1)} archive "${archiveTitle}"`
        }
      );

      // Update local state
      setArchives(archives.map(a => 
        a.id === id 
          ? { ...a, isFeatured: updatedData.isFeatured, status: updatedData.status }
          : a
      ));
      
      toast.success(`Archive "${archiveTitle}" ${updatedData.isFeatured ? 'featured' : 'unfeatured'} successfully`);
    } catch (error) {
      console.error("Error updating archive:", error);
      const errorMessage = error instanceof Error ? error.message : `Failed to update archive "${archiveTitle}"`;
      toast.error(errorMessage);
    } finally {
      setFeaturingId(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Archives</h3>
            <p className="text-gray-600">Please wait while we fetch your archives...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center h-96 space-y-6">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h3>
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
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard')}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Archive Management</h1>
          <p className="text-muted-foreground">
            Manage your audio archives, uploads, and content library
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateArchive} className="bg-brand-600 hover:bg-brand-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Archive
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="archives">All Archives</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Archives</CardTitle>
                  <Archive className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalArchives}</div>
                  <p className="text-xs text-muted-foreground">
                    +{stats.thisMonthUploads} this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Plays</CardTitle>
                  <Play className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalPlays?.toLocaleString() || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatDuration(Math.round(stats.averageDuration))} avg
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Downloads</CardTitle>
                  <Download className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalDownloads?.toLocaleString() || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.featuredCount} featured
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatFileSize(stats.totalStorageUsed)}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.mostPopularType.toLowerCase()} most popular
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Archives */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Archives</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredArchives.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No archives to display</h4>
                  <p className="text-gray-600 mb-4">Create your first archive to see it here.</p>
                  <Button onClick={handleCreateArchive} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Archive
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredArchives.slice(0, 5).map((archive) => (
                    <div key={archive.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          {archive.coverImage ? (
                            <img 
                              src={archive.coverImage} 
                              alt={archive.title}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Play className="h-6 w-6 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">{archive.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {archive.host} • {formatDuration(archive.duration)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(archive.status)}>
                          {archive.status}
                        </Badge>
                        <Badge className={getTypeColor(archive.type)}>
                          {archive.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {filteredArchives.length > 5 && (
                    <div className="text-center pt-4">
                      <Button variant="outline" size="sm" onClick={() => document.querySelector('[value="archives"]')?.click()}>
                        View All Archives
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archives">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search archives..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="FEATURED">Featured</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="PODCAST">Podcast</SelectItem>
                <SelectItem value="SHOW">Show</SelectItem>
                <SelectItem value="MUSIC">Music</SelectItem>
                <SelectItem value="DOCUMENTARY">Documentary</SelectItem>
                <SelectItem value="INTERVIEW">Interview</SelectItem>
                <SelectItem value="NEWS">News</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Archives Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Plays</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredArchives.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <div className="flex flex-col items-center space-y-4">
                          {searchTerm || statusFilter !== "all" || typeFilter !== "all" ? (
                            <>
                              <Search className="h-12 w-12 text-gray-400" />
                              <div className="text-center">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No archives found</h3>
                                <p className="text-gray-600 mb-4">No archives match your current filters. Try adjusting your search criteria.</p>
                                <Button 
                                  variant="outline" 
                                  onClick={() => {
                                    setSearchTerm("");
                                    setStatusFilter("all");
                                    setTypeFilter("all");
                                  }}
                                >
                                  Clear Filters
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <FileX className="h-12 w-12 text-gray-400" />
                              <div className="text-center">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No archives yet</h3>
                                <p className="text-gray-600 mb-4">Get started by creating your first audio archive.</p>
                                <Button onClick={handleCreateArchive}>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Create First Archive
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredArchives.map((archive) => (
                      <TableRow key={archive.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{archive.title}</div>
                            <div className="text-sm text-muted-foreground">{archive.category}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(archive.type)}>
                            {archive.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(archive.status)}>
                            {archive.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{archive.host}</TableCell>
                        <TableCell>{formatDuration(archive.duration)}</TableCell>
                        <TableCell>{archive.playCount.toLocaleString()}</TableCell>
                        <TableCell>{formatDate(archive.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => router.push(`/dashboard/archives/${archive.id}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditArchive(archive.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleToggleFeatured(archive.id)}
                                disabled={featuringId === archive.id}
                              >
                                {featuringId === archive.id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Eye className="mr-2 h-4 w-4" />
                                )}
                                {featuringId === archive.id 
                                  ? "Updating..." 
                                  : archive.isFeatured ? "Unfeature" : "Feature"
                                }
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteArchive(archive.id)}
                                className="text-red-600"
                                disabled={deletingId === archive.id}
                              >
                                {deletingId === archive.id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="mr-2 h-4 w-4" />
                                )}
                                {deletingId === archive.id ? "Deleting..." : "Delete"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          {total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-medium">{(page - 1) * 10 + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(page * 10, total)}
                </span>{" "}
                of <span className="font-medium">{total}</span> archives
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1 || loading}
                  className="flex items-center space-x-1"
                >
                  <span>Previous</span>
                </Button>
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-muted-foreground">Page</span>
                  <span className="text-sm font-medium">{page}</span>
                  <span className="text-sm text-muted-foreground">of {totalPages}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages || loading}
                  className="flex items-center space-x-1"
                >
                  <span>Next</span>
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Archive Analytics</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Detailed insights about your archive performance
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Detailed analytics and reporting features will be available here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Archive Settings</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure archive management preferences
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <h3 className="text-lg font-semibold mb-2">Settings Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Archive configuration options will be available here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}