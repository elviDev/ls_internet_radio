"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Upload, 
  Search, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash, 
  Image as ImageIcon, 
  Music, 
  Video, 
  File,
  Download,
  Tag,
  Calendar,
  User
} from "lucide-react"
import { toast } from "sonner"

type Asset = {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  type: "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT"
  url: string
  description?: string
  tags?: string
  uploadedBy: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  _count: {
    broadcasts: number
  }
  createdAt: string
  updatedAt: string
}

async function fetchAssets(params: URLSearchParams) {
  try {
    const response = await fetch(`/api/admin/assets?${params.toString()}`)
    if (!response.ok) {
      throw new Error('Failed to fetch assets')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching assets:', error)
    return { assets: [], pagination: { page: 1, perPage: 20, total: 0, totalPages: 0 } }
  }
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [pagination, setPagination] = useState({ page: 1, perPage: 20, total: 0, totalPages: 0 })
  const [filter, setFilter] = useState<"all" | "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    files: [] as File[],
    description: "",
    tags: ""
  })
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    loadAssets()
  }, [filter, searchQuery, pagination.page])

  const loadAssets = async () => {
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      perPage: pagination.perPage.toString(),
      type: filter,
      search: searchQuery,
    })
    const data = await fetchAssets(params)
    setAssets(data.assets || [])
    setPagination(data.pagination || { page: 1, perPage: 20, total: 0, totalPages: 0 })
  }

  const handleUpload = async () => {
    if (uploadForm.files.length === 0) {
      toast.error("Please select at least one file to upload")
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    
    // Add all files to the form data
    uploadForm.files.forEach((file) => {
      formData.append("files", file)
    })
    
    formData.append("description", uploadForm.description)
    formData.append("tags", uploadForm.tags)

    try {
      const response = await fetch('/api/admin/assets/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        
        if (uploadForm.files.length === 1) {
          // Single file upload - result is a single asset
          setAssets([result, ...assets])
          toast.success("Asset uploaded successfully")
        } else {
          // Multiple file upload - result contains assets array and summary
          if (result.assets) {
            setAssets([...result.assets, ...assets])
          }
          
          if (result.summary) {
            const { successful, failed, total } = result.summary
            if (failed === 0) {
              toast.success(`All ${total} files uploaded successfully`)
            } else if (successful === 0) {
              toast.error(`All ${total} file uploads failed`)
            } else {
              toast.success(`${successful} of ${total} files uploaded successfully`)
              if (result.errors) {
                // Show details about failed uploads
                result.errors.forEach((error: any) => {
                  toast.error(`${error.filename}: ${error.error}`)
                })
              }
            }
          }
        }
        
        setIsUploadDialogOpen(false)
        setUploadForm({ files: [], description: "", tags: "" })
      } else {
        const error = await response.json()
        if (error.errors && Array.isArray(error.errors)) {
          // Multiple file upload with all failures
          error.errors.forEach((err: any) => {
            toast.error(`${err.filename}: ${err.error}`)
          })
        } else {
          toast.error(error.error || "Failed to upload assets")
        }
      }
    } catch (error) {
      console.error('Error uploading assets:', error)
      toast.error("Failed to upload assets")
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    setUploadForm({ ...uploadForm, files: selectedFiles })
  }

  const removeFile = (index: number) => {
    const newFiles = uploadForm.files.filter((_, i) => i !== index)
    setUploadForm({ ...uploadForm, files: newFiles })
  }

  const handleDelete = async (asset: Asset) => {
    if (asset._count.broadcasts > 0) {
      toast.error("Cannot delete asset that is being used by broadcasts")
      return
    }

    try {
      const response = await fetch(`/api/admin/assets/${asset.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setAssets(assets.filter(a => a.id !== asset.id))
        toast.success("Asset deleted successfully")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to delete asset")
      }
    } catch (error) {
      console.error('Error deleting asset:', error)
      toast.error("Failed to delete asset")
    }
  }

  const getAssetIcon = (type: string) => {
    switch (type) {
      case "IMAGE": return ImageIcon
      case "AUDIO": return Music
      case "VIDEO": return Video
      default: return File
    }
  }

  const getAssetTypeColor = (type: string) => {
    switch (type) {
      case "IMAGE": return "bg-green-100 text-green-800 border-green-200"
      case "AUDIO": return "bg-blue-100 text-blue-800 border-blue-200"
      case "VIDEO": return "bg-purple-100 text-purple-800 border-purple-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getTags = (tagsString?: string) => {
    if (!tagsString) return []
    try {
      return JSON.parse(tagsString)
    } catch {
      return tagsString.split(',').map(tag => tag.trim()).filter(Boolean)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Asset Management</h1>
          <p className="text-slate-500 mt-1">Manage images, audio files, and other assets for broadcasting</p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Asset
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload New Assets</DialogTitle>
              <DialogDescription>Upload images, audio files, or other assets for broadcasting (max 20 files)</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="files">Files</Label>
                <Input
                  id="files"
                  type="file"
                  accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
                  multiple
                  onChange={handleFileSelect}
                />
                {uploadForm.files.length > 0 && (
                  <div className="space-y-2 mt-3">
                    <p className="text-sm text-slate-600 font-medium">
                      Selected {uploadForm.files.length} file{uploadForm.files.length !== 1 ? 's' : ''}:
                    </p>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {uploadForm.files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-slate-50 rounded-lg p-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="flex-shrink-0">
                              {file.type.startsWith('image/') && <ImageIcon className="h-4 w-4 text-green-600" />}
                              {file.type.startsWith('audio/') && <Music className="h-4 w-4 text-blue-600" />}
                              {file.type.startsWith('video/') && <Video className="h-4 w-4 text-purple-600" />}
                              {!file.type.startsWith('image/') && !file.type.startsWith('audio/') && !file.type.startsWith('video/') && <File className="h-4 w-4 text-gray-600" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="flex-shrink-0 h-8 w-8 p-0"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  placeholder="Describe these assets..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (Optional)</Label>
                <Input
                  id="tags"
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                  placeholder="music, intro, jingle, etc. (comma-separated)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={uploadForm.files.length === 0 || isUploading}>
                {isUploading ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    Uploading {uploadForm.files.length} file{uploadForm.files.length !== 1 ? 's' : ''}...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload {uploadForm.files.length > 0 ? `${uploadForm.files.length} file${uploadForm.files.length !== 1 ? 's' : ''}` : 'Files'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={filter} onValueChange={(value: any) => setFilter(value)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="IMAGE">Images</TabsTrigger>
            <TabsTrigger value="AUDIO">Audio</TabsTrigger>
            <TabsTrigger value="VIDEO">Video</TabsTrigger>
            <TabsTrigger value="DOCUMENT">Documents</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {assets.map((asset) => {
          const Icon = getAssetIcon(asset.type)
          const tags = getTags(asset.tags)
          
          return (
            <Card key={asset.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-slate-600" />
                    <Badge variant="outline" className={getAssetTypeColor(asset.type)}>
                      {asset.type}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => window.open(asset.url, '_blank')}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.open(asset.url, '_blank')}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => handleDelete(asset)}
                        disabled={asset._count.broadcasts > 0}
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Preview */}
                {asset.type === "IMAGE" && (
                  <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden">
                    <img 
                      src={asset.url} 
                      alt={asset.originalName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {asset.type === "AUDIO" && (
                  <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center">
                    <Music className="h-12 w-12 text-slate-400" />
                  </div>
                )}

                {asset.type === "VIDEO" && (
                  <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center">
                    <Video className="h-12 w-12 text-slate-400" />
                  </div>
                )}

                {asset.type === "DOCUMENT" && (
                  <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center">
                    <File className="h-12 w-12 text-slate-400" />
                  </div>
                )}

                {/* File Info */}
                <div className="space-y-2">
                  <h3 className="font-medium text-sm leading-tight">{asset.originalName}</h3>
                  <p className="text-xs text-slate-500">{formatFileSize(asset.size)}</p>
                  
                  {asset.description && (
                    <p className="text-xs text-slate-600 line-clamp-2">{asset.description}</p>
                  )}

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tags.slice(0, 3).map((tag: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{`${asset.uploadedBy.firstName} ${asset.uploadedBy.lastName}`}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(asset.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {asset._count.broadcasts > 0 && (
                    <div className="flex items-center gap-1 text-xs text-blue-600">
                      <Tag className="h-3 w-3" />
                      <span>Used in {asset._count.broadcasts} broadcast{asset._count.broadcasts !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            disabled={pagination.page === 1}
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
          >
            Previous
          </Button>
          <span className="text-sm text-slate-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={pagination.page === pagination.totalPages}
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
          >
            Next
          </Button>
        </div>
      )}

      {assets.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Upload className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-500 text-center">No assets found</p>
            <Button variant="outline" className="mt-4" onClick={() => setIsUploadDialogOpen(true)}>
              Upload Your First Asset
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}