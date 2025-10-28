"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FileUpload } from "@/components/ui/file-upload";
import { toast } from "sonner";
import { fetchWithErrorHandling } from "@/lib/utils/network-error-handler";
import {
  Upload,
  Settings,
  Save,
  ArrowLeft,
} from "lucide-react";

interface ArchiveFormData {
  title: string;
  description: string;
  host: string;
  guests: string;
  category: string;
  type: "PODCAST" | "SHOW" | "MUSIC" | "DOCUMENTARY" | "INTERVIEW" | "NEWS";
  status: "ACTIVE" | "ARCHIVED" | "FEATURED" | "DRAFT";
  originalAirDate: string;
  isDownloadable: boolean;
  isFeatured: boolean;
  audioFile: string;
  coverImage: string;
  transcript: string;
  tags: string[];
}

export default function NewArchivePage() {
  const router = useRouter();
  // Using sonner toast

  const [formData, setFormData] = useState<ArchiveFormData>({
    title: "",
    description: "",
    host: "",
    guests: "",
    category: "",
    type: "PODCAST",
    status: "DRAFT",
    originalAirDate: "",
    isDownloadable: true,
    isFeatured: false,
    audioFile: "",
    coverImage: "",
    transcript: "",
    tags: [],
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState("");
  const [audioFileData, setAudioFileData] = useState<any>(null);
  const [coverImageData, setCoverImageData] = useState<any>(null);

  const categories = [
    "Technology",
    "Business",
    "Talk Show",
    "Science",
    "Entertainment",
    "Interview",
    "Sports",
    "Arts",
    "Education",
    "News",
    "Music",
    "Fiction",
    "Non-Fiction",
    "Comedy",
    "Documentary",
  ];

  const handleInputChange = (field: keyof ArchiveFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAudioFileChange = (fileUrl: string, fileData?: any) => {
    setFormData(prev => ({ ...prev, audioFile: fileUrl }));
    setAudioFileData(fileData);
    if (errors.audioFile) {
      setErrors(prev => ({ ...prev, audioFile: '' }));
    }
  };

  const handleCoverImageChange = (fileUrl: string, fileData?: any) => {
    setFormData(prev => ({ ...prev, coverImage: fileUrl }));
    setCoverImageData(fileData);
    if (errors.coverImage) {
      setErrors(prev => ({ ...prev, coverImage: '' }));
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Required field validation
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 3) {
      newErrors.title = "Title must be at least 3 characters long";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters long";
    }

    if (!formData.host.trim()) {
      newErrors.host = "Host name is required";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    if (!formData.audioFile) {
      newErrors.audioFile = "Audio file is required";
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      // Show first error
      const firstError = Object.values(newErrors)[0];
      toast.error(firstError);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      setUploadStage("Preparing archive data...");
      setUploadProgress(20);
      
      const fileSize = audioFileData?.size || 0;
      const duration = audioFileData?.metadata?.duration || 0;

      // Create archive record
      const archiveData = {
        title: formData.title,
        description: formData.description,
        host: formData.host,
        guests: formData.guests,
        category: formData.category,
        type: formData.type,
        status: formData.status,
        originalAirDate: formData.originalAirDate || null,
        isDownloadable: formData.isDownloadable,
        isFeatured: formData.isFeatured,
        audioFile: formData.audioFile,
        downloadUrl: formData.audioFile,
        coverImage: formData.coverImage,
        fileSize,
        duration,
        transcript: formData.transcript,
        tags: formData.tags,
        accessLevel: "PUBLIC",
        isExclusive: false,
      };

      setUploadStage("Creating archive record...");
      setUploadProgress(80);
      
      const result = await fetchWithErrorHandling(
        "/api/admin/archives",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(archiveData),
          timeout: 30000,
          retries: 2,
          context: "Creating archive record"
        }
      );
      setUploadStage("Archive created successfully!");
      setUploadProgress(100);
      
      toast.success("Archive created successfully");
      router.push(`/dashboard/archives/${result.archive.id}`);
    } catch (error) {
      console.error("Error creating archive:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create archive");
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setUploadStage("");
      }, 2000); // Keep success message visible for 2 seconds
    }
  };


  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Archive</h1>
          <p className="text-muted-foreground">
            Upload and configure a new audio archive
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => {
                    handleInputChange('title', e.target.value);
                    if (errors.title) {
                      setErrors(prev => ({ ...prev, title: '' }));
                    }
                  }}
                  placeholder="Enter archive title"
                  className={errors.title ? 'border-red-500 focus:border-red-500' : ''}
                  required
                />
                {errors.title && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="text-red-500">⚠</span>
                    {errors.title}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="host">Host *</Label>
                <Input
                  id="host"
                  value={formData.host}
                  onChange={(e) => {
                    handleInputChange('host', e.target.value);
                    if (errors.host) {
                      setErrors(prev => ({ ...prev, host: '' }));
                    }
                  }}
                  placeholder="Enter host name"
                  className={errors.host ? 'border-red-500 focus:border-red-500' : ''}
                  required
                />
                {errors.host && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="text-red-500">⚠</span>
                    {errors.host}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => {
                  handleInputChange('description', e.target.value);
                  if (errors.description) {
                    setErrors(prev => ({ ...prev, description: '' }));
                  }
                }}
                placeholder="Enter archive description"
                className={errors.description ? 'border-red-500 focus:border-red-500' : ''}
                rows={3}
                required
              />
              {errors.description && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <span className="text-red-500">⚠</span>
                  {errors.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PODCAST">Podcast</SelectItem>
                    <SelectItem value="BROADCAST">Broadcast</SelectItem>
                    <SelectItem value="AUDIOBOOK">Audiobook</SelectItem>
                    <SelectItem value="INTERVIEW">Interview</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => {
                    handleInputChange('category', value);
                    if (errors.category) {
                      setErrors(prev => ({ ...prev, category: '' }));
                    }
                  }}
                >
                  <SelectTrigger className={errors.category ? 'border-red-500 focus:border-red-500' : ''}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="text-red-500">⚠</span>
                    {errors.category}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="FEATURED">Featured</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                    <SelectItem value="HIDDEN">Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guests">Guests</Label>
                <Input
                  id="guests"
                  value={formData.guests}
                  onChange={(e) => handleInputChange('guests', e.target.value)}
                  placeholder="Enter guest names (optional)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="originalAirDate">Original Air Date</Label>
                <Input
                  id="originalAirDate"
                  type="datetime-local"
                  value={formData.originalAirDate}
                  onChange={(e) => handleInputChange('originalAirDate', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Uploads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              File Uploads
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Audio File Upload */}
            <FileUpload
              type="audio"
              value={formData.audioFile}
              onChange={handleAudioFileChange}
              label="Audio File"
              description="Upload an audio file for the archive"
              required
              className={errors.audioFile ? 'border-red-500' : ''}
            />
            {errors.audioFile && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <span className="text-red-500">⚠</span>
                {errors.audioFile}
              </p>
            )}

            {/* Cover Image Upload */}
            <FileUpload
              type="image"
              value={formData.coverImage}
              onChange={handleCoverImageChange}
              label="Cover Image"
              description="Upload a cover image for the archive (optional)"
              className={errors.coverImage ? 'border-red-500' : ''}
            />
            {errors.coverImage && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <span className="text-red-500">⚠</span>
                {errors.coverImage}
              </p>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-blue-700">
                  <Upload className="h-4 w-4 animate-pulse" />
                  <span className="font-medium">Creating Archive</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-blue-600">
                    <span>{uploadStage || 'Processing...'}</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full bg-blue-100 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
                
                {uploadProgress < 100 && (
                  <p className="text-xs text-blue-600">
                    Please don't close this page while the archive is being created.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Content */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transcript">Transcript</Label>
              <Textarea
                id="transcript"
                value={formData.transcript}
                onChange={(e) => handleInputChange('transcript', e.target.value)}
                placeholder="Enter transcript (optional)"
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add tags"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" onClick={addTag} variant="outline">
                  Add
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Archive Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="downloadable">Allow Downloads</Label>
                <div className="text-sm text-muted-foreground">
                  Enable users to download this archive
                </div>
              </div>
              <Switch
                id="downloadable"
                checked={formData.isDownloadable}
                onCheckedChange={(checked) => handleInputChange('isDownloadable', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="featured">Featured Archive</Label>
                <div className="text-sm text-muted-foreground">
                  Highlight this archive on the main page
                </div>
              </div>
              <Switch
                id="featured"
                checked={formData.isFeatured}
                onCheckedChange={(checked) => handleInputChange('isFeatured', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isUploading}
            className="bg-brand-600 hover:bg-brand-700"
          >
            {isUploading ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-spin" />
                Creating Archive...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Archive
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}