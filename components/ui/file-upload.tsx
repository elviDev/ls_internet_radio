"use client";

import React, { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Upload, 
  File, 
  Image as ImageIcon, 
  Music, 
  X, 
  Check,
  FolderOpen,
  Search,
  Play,
  Pause,
  Download,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface Asset {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  type: "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT";
  url: string;
  description?: string;
  tags?: string;
  uploadedBy: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

interface FileUploadProps {
  type: "audio" | "image";
  value?: string; // Current file URL
  onChange: (fileUrl: string, fileData?: any) => void;
  label: string;
  description?: string;
  required?: boolean;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
}

export function FileUpload({
  type,
  value,
  onChange,
  label,
  description,
  required = false,
  accept,
  maxSize = type === "audio" ? 100 : 10,
  className = "",
}: FileUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [audioPreview, setAudioPreview] = useState<{ url: string; playing: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const acceptedTypes = accept || (type === "audio" 
    ? "audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/flac,audio/m4a"
    : "image/jpeg,image/jpg,image/png,image/webp,image/gif"
  );

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    const allowedTypes = acceptedTypes.split(',');
    if (!allowedTypes.includes(file.type)) {
      return `Invalid file type. Allowed types: ${acceptedTypes}`;
    }
    
    const maxBytes = maxSize * 1024 * 1024;
    if (file.size > maxBytes) {
      return `File size exceeds ${maxSize}MB limit`;
    }
    
    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    handleUpload(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    handleUpload(file);
  }, [maxSize, acceptedTypes]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(percentComplete);
        }
      });

      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
      });

      xhr.open("POST", "/api/admin/archives/upload");
      xhr.send(formData);

      const response: any = await uploadPromise;
      
      onChange(response.file.url, {
        name: response.file.originalName,
        size: response.file.size,
        type: response.file.type,
        url: response.file.url,
        metadata: response.file.metadata,
      });

      toast.success("File uploaded successfully");
      setIsOpen(false);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const loadAssets = async () => {
    setAssetsLoading(true);
    try {
      const assetType = type === "audio" ? "AUDIO" : "IMAGE";
      const response = await fetch(`/api/admin/assets?type=${assetType}&limit=100`);
      if (response.ok) {
        const data = await response.json();
        setAssets(data.assets || []);
      } else {
        console.error("Failed to load assets:", response.status, response.statusText);
        toast.error("Failed to load assets");
      }
    } catch (error) {
      console.error("Error loading assets:", error);
      toast.error("Failed to load assets");
    } finally {
      setAssetsLoading(false);
    }
  };

  const handleAssetSelect = (asset: Asset) => {
    setSelectedAsset(asset);
  };

  const confirmAssetSelection = () => {
    if (selectedAsset) {
      onChange(selectedAsset.url, {
        name: selectedAsset.originalName,
        size: selectedAsset.size,
        type: selectedAsset.mimeType,
        url: selectedAsset.url,
        id: selectedAsset.id,
      });
      setIsOpen(false);
      setSelectedAsset(null);
    }
  };

  const toggleAudioPreview = (asset: Asset) => {
    if (audioPreview?.url === asset.url) {
      if (audioPreview.playing) {
        audioRef.current?.pause();
        setAudioPreview({ ...audioPreview, playing: false });
      } else {
        audioRef.current?.play();
        setAudioPreview({ ...audioPreview, playing: true });
      }
    } else {
      if (audioRef.current) {
        audioRef.current.src = asset.url;
        audioRef.current.play();
        setAudioPreview({ url: asset.url, playing: true });
      }
    }
  };

  const filteredAssets = assets.filter(asset =>
    asset.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentFileName = value ? value.split('/').pop() || 'Selected file' : '';

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Label>{label}</Label>
        {required && <span className="text-red-500">*</span>}
      </div>
      
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      <div className="space-y-2">
        {value ? (
          <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
            {type === "audio" ? <Music className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
            <span className="text-sm flex-1">{currentFileName}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(true)}
            >
              Change
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onChange("", {})}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(true)}
            className="w-full h-24 border-dashed"
          >
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-6 w-6" />
              <span>Choose or upload {type} file</span>
            </div>
          </Button>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Select or Upload {type === "audio" ? "Audio" : "Image"} File</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="upload" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload New File</TabsTrigger>
              <TabsTrigger value="assets" onClick={loadAssets}>
                Choose from Assets
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="flex-1">
              <div className="space-y-4">
                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  {uploading ? (
                    <div className="space-y-4">
                      <Loader2 className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Uploading...</p>
                        <div className="w-full bg-muted rounded-full h-2 mt-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {Math.round(uploadProgress)}% complete
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {type === "audio" ? (
                        <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      ) : (
                        <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      )}
                      <h3 className="text-lg font-semibold mb-2">
                        Drop your {type} file here
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        or click to browse from your computer
                      </p>
                      <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={acceptedTypes}
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <p className="text-xs text-muted-foreground mt-4">
                        Max file size: {maxSize}MB. Supported formats: {acceptedTypes.replace(/,/g, ', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="assets" className="flex-1 flex flex-col min-h-0">
              <div className="space-y-4 flex-1 flex flex-col min-h-0">
                <div className="flex gap-2 flex-shrink-0">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search assets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 max-h-[50vh]">
                  {assetsLoading ? (
                    <div className="flex items-center justify-center h-48">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : filteredAssets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                      <FolderOpen className="h-12 w-12 mb-2" />
                      <p>No {type} assets found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4 pr-2">
                      {filteredAssets.map((asset) => (
                        <Card
                          key={asset.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedAsset?.id === asset.id ? 'ring-2 ring-primary' : ''
                          }`}
                          onClick={() => handleAssetSelect(asset)}
                        >
                          <CardContent className="p-3">
                            <div className="aspect-square relative mb-2 bg-muted rounded-lg flex items-center justify-center">
                              {type === "image" ? (
                                <img
                                  src={asset.url}
                                  alt={asset.originalName}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <div className="flex flex-col items-center">
                                  <Music className="h-8 w-8 text-muted-foreground mb-2" />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleAudioPreview(asset);
                                    }}
                                  >
                                    {audioPreview?.url === asset.url && audioPreview.playing ? (
                                      <Pause className="h-3 w-3" />
                                    ) : (
                                      <Play className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              )}
                              {selectedAsset?.id === asset.id && (
                                <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-1">
                                  <Check className="h-3 w-3" />
                                </div>
                              )}
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium truncate">
                                {asset.originalName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(asset.size)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                by {asset.uploadedBy.firstName} {asset.uploadedBy.lastName}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {selectedAsset && (
                  <div className="border-t pt-4 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{selectedAsset.originalName}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(selectedAsset.size)} • {selectedAsset.mimeType}
                        </p>
                      </div>
                      <Button onClick={confirmAssetSelection}>
                        Select This File
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {type === "audio" && (
        <audio
          ref={audioRef}
          onEnded={() => setAudioPreview(prev => prev ? { ...prev, playing: false } : null)}
          className="hidden"
        />
      )}
    </div>
  );
}