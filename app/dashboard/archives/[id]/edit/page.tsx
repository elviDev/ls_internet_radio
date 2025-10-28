"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/ui/file-upload";
import { ArrowLeft, Save, X, Plus, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { fetchWithErrorHandling } from "@/lib/utils/network-error-handler";

interface ArchiveFormData {
  title: string;
  description: string;
  host: string;
  guests: string;
  category: string;
  type: string;
  status: string;
  duration: number;
  fileSize: number;
  audioFile: string;
  downloadUrl: string;
  coverImage: string;
  thumbnailImage: string;
  originalAirDate: string;
  isDownloadable: boolean;
  isFeatured: boolean;
  isExclusive: boolean;
  accessLevel: string;
  tags: string[];
  transcript: string;
  transcriptFile: string;
  podcastId: string;
  audiobookId: string;
  broadcastId: string;
  episodeId: string;
}

const ARCHIVE_TYPES = [
  { value: "PODCAST", label: "Podcast" },
  { value: "SHOW", label: "Show" },
  { value: "MUSIC", label: "Music" },
  { value: "DOCUMENTARY", label: "Documentary" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "NEWS", label: "News" },
];

const ARCHIVE_STATUSES = [
  { value: "ACTIVE", label: "Active" },
  { value: "ARCHIVED", label: "Archived" },
  { value: "FEATURED", label: "Featured" },
  { value: "DRAFT", label: "Draft" },
];

const ACCESS_LEVELS = [
  { value: "PUBLIC", label: "Public" },
  { value: "MEMBERS_ONLY", label: "Members Only" },
  { value: "STAFF_ONLY", label: "Staff Only" },
];

const CATEGORIES = [
  "Technology",
  "Business",
  "Health",
  "Science",
  "Education",
  "Entertainment",
  "Sports",
  "News",
  "Music",
  "Arts",
  "Comedy",
  "History",
  "Politics",
  "Religion",
  "Society",
];

export default function EditArchivePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [audioFileData, setAudioFileData] = useState<any>(null);
  const [coverImageData, setCoverImageData] = useState<any>(null);
  const [formData, setFormData] = useState<ArchiveFormData>({
    title: "",
    description: "",
    host: "",
    guests: "",
    category: "",
    type: "PODCAST",
    status: "ACTIVE",
    duration: 0,
    fileSize: 0,
    audioFile: "",
    downloadUrl: "",
    coverImage: "",
    thumbnailImage: "",
    originalAirDate: "",
    isDownloadable: true,
    isFeatured: false,
    isExclusive: false,
    accessLevel: "PUBLIC",
    tags: [],
    transcript: "",
    transcriptFile: "",
    podcastId: "",
    audiobookId: "",
    broadcastId: "",
    episodeId: "",
  });

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
          context: "Loading archive for editing"
        }
      );
      setFormData({
        title: data.title || "",
        description: data.description || "",
        host: data.host || "",
        guests: data.guests || "",
        category: data.category || "",
        type: data.type || "PODCAST",
        status: data.status || "ACTIVE",
        duration: data.duration || 0,
        fileSize: data.fileSize || 0,
        audioFile: data.audioFile || "",
        downloadUrl: data.downloadUrl || "",
        coverImage: data.coverImage || "",
        thumbnailImage: data.thumbnailImage || "",
        originalAirDate: data.originalAirDate 
          ? new Date(data.originalAirDate).toISOString().split('T')[0]
          : "",
        isDownloadable: data.isDownloadable || false,
        isFeatured: data.isFeatured || false,
        isExclusive: data.isExclusive || false,
        accessLevel: data.accessLevel || "PUBLIC",
        tags: data.tags || [],
        transcript: data.transcript || "",
        transcriptFile: data.transcriptFile || "",
        podcastId: data.podcastId || "",
        audiobookId: data.audiobookId || "",
        broadcastId: data.broadcastId || "",
        episodeId: data.episodeId || "",
      });
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

  const handleInputChange = (field: keyof ArchiveFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAudioFileChange = (fileUrl: string, fileData?: any) => {
    setFormData(prev => ({ ...prev, audioFile: fileUrl, downloadUrl: fileUrl }));
    setAudioFileData(fileData);
    // Update file size and duration if available
    if (fileData?.size) {
      setFormData(prev => ({ ...prev, fileSize: fileData.size }));
    }
    if (fileData?.metadata?.duration) {
      setFormData(prev => ({ ...prev, duration: fileData.metadata.duration }));
    }
  };

  const handleCoverImageChange = (fileUrl: string, fileData?: any) => {
    setFormData(prev => ({ ...prev, coverImage: fileUrl }));
    setCoverImageData(fileData);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await fetchWithErrorHandling(
        `/api/admin/archives/${params.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
          timeout: 30000,
          retries: 2,
          context: `Updating archive "${formData.title}"`
        }
      );
      toast.success(`Archive "${formData.title}" updated successfully`);
      router.push(`/dashboard/archives/${params.id}`);
    } catch (error) {
      console.error("Error updating archive:", error);
      const errorMessage = error instanceof Error ? error.message : `Failed to update archive "${formData.title}"`;
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Archive Data</h3>
          <p className="text-gray-600">Please wait while we load the archive information for editing...</p>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/dashboard/archives/${params.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Archive</h1>
            <p className="text-gray-600">{formData.title}</p>
          </div>
        </div>
        <Button 
          onClick={handleSubmit} 
          disabled={saving}
          className="flex items-center space-x-2"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>{saving ? "Saving..." : "Save Changes"}</span>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="host">Host</Label>
                    <Input
                      id="host"
                      value={formData.host}
                      onChange={(e) => handleInputChange("host", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="guests">Guests</Label>
                    <Input
                      id="guests"
                      value={formData.guests}
                      onChange={(e) => handleInputChange("guests", e.target.value)}
                      placeholder="Comma-separated list"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleInputChange("category", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => handleInputChange("type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ARCHIVE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* File Information */}
            <Card>
              <CardHeader>
                <CardTitle>File Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Audio File Upload */}
                <FileUpload
                  type="audio"
                  value={formData.audioFile}
                  onChange={handleAudioFileChange}
                  label="Audio File"
                  description="Upload or select an audio file for the archive"
                />

                {/* Cover Image Upload */}
                <FileUpload
                  type="image"
                  value={formData.coverImage}
                  onChange={handleCoverImageChange}
                  label="Cover Image"
                  description="Upload or select a cover image for the archive"
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration">Duration (seconds)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => handleInputChange("duration", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fileSize">File Size (bytes)</Label>
                    <Input
                      id="fileSize"
                      type="number"
                      value={formData.fileSize}
                      onChange={(e) => handleInputChange("fileSize", parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="downloadUrl">Download URL</Label>
                  <Input
                    id="downloadUrl"
                    value={formData.downloadUrl}
                    onChange={(e) => handleInputChange("downloadUrl", e.target.value)}
                    placeholder="URL for file downloads (auto-filled from audio file)"
                  />
                </div>

                <div>
                  <Label htmlFor="thumbnailImage">Thumbnail Image URL</Label>
                  <Input
                    id="thumbnailImage"
                    value={formData.thumbnailImage}
                    onChange={(e) => handleInputChange("thumbnailImage", e.target.value)}
                    placeholder="URL for thumbnail image (optional)"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Transcript */}
            <Card>
              <CardHeader>
                <CardTitle>Transcript</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="transcript">Transcript Text</Label>
                  <Textarea
                    id="transcript"
                    value={formData.transcript}
                    onChange={(e) => handleInputChange("transcript", e.target.value)}
                    rows={10}
                    placeholder="Enter the transcript text..."
                  />
                </div>

                <div>
                  <Label htmlFor="transcriptFile">Transcript File URL</Label>
                  <Input
                    id="transcriptFile"
                    value={formData.transcriptFile}
                    onChange={(e) => handleInputChange("transcriptFile", e.target.value)}
                    placeholder="URL to transcript file (PDF, TXT, etc.)"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publishing Options */}
            <Card>
              <CardHeader>
                <CardTitle>Publishing Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ARCHIVE_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="accessLevel">Access Level</Label>
                  <Select
                    value={formData.accessLevel}
                    onValueChange={(value) => handleInputChange("accessLevel", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCESS_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="originalAirDate">Original Air Date</Label>
                  <Input
                    id="originalAirDate"
                    type="date"
                    value={formData.originalAirDate}
                    onChange={(e) => handleInputChange("originalAirDate", e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isDownloadable">Allow Downloads</Label>
                    <Switch
                      id="isDownloadable"
                      checked={formData.isDownloadable}
                      onCheckedChange={(checked) =>
                        handleInputChange("isDownloadable", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="isFeatured">Featured</Label>
                    <Switch
                      id="isFeatured"
                      checked={formData.isFeatured}
                      onCheckedChange={(checked) =>
                        handleInputChange("isFeatured", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="isExclusive">Exclusive</Label>
                    <Switch
                      id="isExclusive"
                      checked={formData.isExclusive}
                      onCheckedChange={(checked) =>
                        handleInputChange("isExclusive", checked)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTag}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Relations */}
            <Card>
              <CardHeader>
                <CardTitle>Relations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="podcastId">Podcast ID</Label>
                  <Input
                    id="podcastId"
                    value={formData.podcastId}
                    onChange={(e) => handleInputChange("podcastId", e.target.value)}
                    placeholder="Link to podcast"
                  />
                </div>

                <div>
                  <Label htmlFor="audiobookId">Audiobook ID</Label>
                  <Input
                    id="audiobookId"
                    value={formData.audiobookId}
                    onChange={(e) => handleInputChange("audiobookId", e.target.value)}
                    placeholder="Link to audiobook"
                  />
                </div>

                <div>
                  <Label htmlFor="broadcastId">Broadcast ID</Label>
                  <Input
                    id="broadcastId"
                    value={formData.broadcastId}
                    onChange={(e) => handleInputChange("broadcastId", e.target.value)}
                    placeholder="Link to broadcast"
                  />
                </div>

                <div>
                  <Label htmlFor="episodeId">Episode ID</Label>
                  <Input
                    id="episodeId"
                    value={formData.episodeId}
                    onChange={(e) => handleInputChange("episodeId", e.target.value)}
                    placeholder="Link to episode"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-4 border-t">
          <Link href={`/dashboard/archives/${params.id}`}>
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving} className="flex items-center space-x-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{saving ? "Saving..." : "Save Changes"}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}