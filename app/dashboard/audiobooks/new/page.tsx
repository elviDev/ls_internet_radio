"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Upload, BookOpen, X, Plus, DollarSign, Image as ImageIcon, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DatePicker } from "@/components/ui/date-picker"

type Genre = {
  id: string
  name: string
  slug: string
}

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
  createdAt: string
  updatedAt: string
}

export default function NewAudiobookPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [genres, setGenres] = useState<Genre[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    narrator: "",
    description: "",
    genreId: "",
    isbn: "",
    publisher: "",
    language: "en",
    price: "",
    currency: "USD",
    isExclusive: false,
    releaseDate: new Date(),
    coverImage: null as File | null,
    selectedAssetId: "",
    tags: [] as string[]
  })
  const [newTag, setNewTag] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isAssetDialogOpen, setIsAssetDialogOpen] = useState(false)
  const [assetSearchQuery, setAssetSearchQuery] = useState("")
  const [uploadingNewAsset, setUploadingNewAsset] = useState(false)

  useEffect(() => {
    fetchGenres()
    fetchAssets()
  }, [])

  const fetchGenres = async () => {
    try {
      const response = await fetch('/api/genres')
      if (response.ok) {
        const data = await response.json()
        setGenres(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching genres:', error)
      setGenres([])
    }
  }

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/admin/assets?type=IMAGE&perPage=50')
      if (response.ok) {
        const data = await response.json()
        setAssets(data.assets || [])
      }
    } catch (error) {
      console.error('Error fetching assets:', error)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (file: File | null) => {
    setFormData((prev) => ({ ...prev, coverImage: file, selectedAssetId: "" }))
  }

  const handleAssetSelect = (assetId: string) => {
    setFormData((prev) => ({ ...prev, selectedAssetId: assetId, coverImage: null }))
    setIsAssetDialogOpen(false)
  }

  const uploadNewAsset = async (file: File): Promise<void> => {
    setUploadingNewAsset(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('description', `Audiobook cover for ${formData.title || 'untitled'}`)
    formData.append('tags', 'audiobook,cover')

    try {
      const response = await fetch('/api/admin/assets/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const newAsset = await response.json()
        setAssets([newAsset, ...assets])
        handleAssetSelect(newAsset.id)
        toast({
          title: "Success",
          description: "Asset uploaded successfully"
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload asset')
      }
    } catch (error) {
      console.error('Error uploading asset:', error)
      toast({
        title: "Error",
        description: "Failed to upload asset",
        variant: "destructive"
      })
    } finally {
      setUploadingNewAsset(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const uploadCoverImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('description', `Audiobook cover for ${formData.title || 'untitled'}`)
    formData.append('tags', 'audiobook,cover')

    const response = await fetch('/api/admin/assets/upload', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error('Failed to upload cover image')
    }

    const data = await response.json()
    // Also add to assets list for immediate use
    setAssets([data, ...assets])
    return data.url
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setUploadProgress(0)

    try {
      let coverImageUrl = "/placeholder.svg"
      
      if (formData.selectedAssetId) {
        // Use selected reusable asset
        const selectedAsset = assets.find(asset => asset.id === formData.selectedAssetId)
        if (selectedAsset) {
          coverImageUrl = selectedAsset.url
        }
        setUploadProgress(60)
      } else if (formData.coverImage) {
        // Upload new cover image
        setUploadProgress(30)
        coverImageUrl = await uploadCoverImage(formData.coverImage)
        setUploadProgress(60)
      }

      const audiobookData = {
        title: formData.title,
        author: formData.author,
        narrator: formData.narrator,
        description: formData.description,
        genreId: formData.genreId,
        isbn: formData.isbn || undefined,
        publisher: formData.publisher || undefined,
        language: formData.language,
        price: formData.price ? parseFloat(formData.price) : undefined,
        currency: formData.currency,
        isExclusive: formData.isExclusive,
        releaseDate: formData.releaseDate.toISOString().split('T')[0],
        coverImage: coverImageUrl,
        tags: formData.tags
      }

      setUploadProgress(80)
      const response = await fetch('/api/admin/audiobooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(audiobookData)
      })

      if (!response.ok) {
        throw new Error('Failed to create audiobook')
      }

      const audiobook = await response.json()
      setUploadProgress(100)
      
      toast({
        title: "Success",
        description: "Audiobook created successfully"
      })
      
      router.push(`/dashboard/audiobooks/${audiobook.id}/chapters`)
    } catch (error) {
      console.error('Error creating audiobook:', error)
      toast({
        title: "Error",
        description: "Failed to create audiobook",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Audiobook</h1>
          <p className="text-muted-foreground">Add a new audiobook to your library</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cover Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Cover Image</CardTitle>
              <CardDescription>Select from existing assets or upload a new cover image (recommended: 400x600px)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="aspect-[2/3] border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center bg-muted/50">
                  {formData.selectedAssetId ? (
                    <img
                      src={assets.find(asset => asset.id === formData.selectedAssetId)?.url}
                      alt="Cover preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : formData.coverImage ? (
                    <img
                      src={URL.createObjectURL(formData.coverImage)}
                      alt="Cover preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-center">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No image selected</p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Dialog open={isAssetDialogOpen} onOpenChange={setIsAssetDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        <span>Select Asset</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>Select Cover Image Asset</DialogTitle>
                        <DialogDescription>Choose from existing image assets or upload a new one</DialogDescription>
                      </DialogHeader>
                      <Tabs defaultValue="existing" className="w-full">
                        <TabsList>
                          <TabsTrigger value="existing">Existing Assets</TabsTrigger>
                          <TabsTrigger value="upload">Upload New</TabsTrigger>
                        </TabsList>
                        <TabsContent value="existing" className="space-y-4">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search assets..."
                              value={assetSearchQuery}
                              onChange={(e) => setAssetSearchQuery(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                          <div className="grid grid-cols-3 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                            {assets
                              .filter(asset => 
                                asset.originalName.toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
                                (asset.description && asset.description.toLowerCase().includes(assetSearchQuery.toLowerCase()))
                              )
                              .map((asset) => (
                                <div
                                  key={asset.id}
                                  className={`relative cursor-pointer border-2 rounded-lg overflow-hidden transition-colors ${
                                    formData.selectedAssetId === asset.id 
                                      ? 'border-primary bg-primary/5' 
                                      : 'border-muted hover:border-primary/50'
                                  }`}
                                  onClick={() => handleAssetSelect(asset.id)}
                                >
                                  <div className="aspect-square">
                                    <img
                                      src={asset.url}
                                      alt={asset.originalName}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2">
                                    <p className="text-xs truncate">{asset.originalName}</p>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </TabsContent>
                        <TabsContent value="upload" className="space-y-4">
                          <div>
                            <Label htmlFor="new-asset-upload">Upload New Image Asset</Label>
                            <Input
                              id="new-asset-upload"
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  await uploadNewAsset(file)
                                }
                              }}
                              disabled={uploadingNewAsset}
                            />
                            {uploadingNewAsset && (
                              <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>
                  <div>
                    <Label htmlFor="cover-upload" className="cursor-pointer">
                      <div className="flex items-center justify-center gap-2 p-3 border border-input rounded-lg hover:bg-accent transition-colors">
                        <Upload className="h-4 w-4" />
                        <span>Upload New</span>
                      </div>
                    </Label>
                    <input
                      id="cover-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>
                {(formData.selectedAssetId || formData.coverImage) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, selectedAssetId: "", coverImage: null }))}
                  >
                    Clear Selection
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Enter the basic details of your audiobook</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="Enter audiobook title"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="author">Author</Label>
                    <Input
                      id="author"
                      value={formData.author}
                      onChange={(e) => handleInputChange("author", e.target.value)}
                      placeholder="Enter book author name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="narrator">Narrator *</Label>
                    <Input
                      id="narrator"
                      value={formData.narrator}
                      onChange={(e) => handleInputChange("narrator", e.target.value)}
                      placeholder="Enter narrator name"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="genre">Genre *</Label>
                    <Select value={formData.genreId} onValueChange={(value) => handleInputChange("genreId", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a genre" />
                      </SelectTrigger>
                      <SelectContent>
                        {genres && Array.isArray(genres) && genres.map((genre) => (
                          <SelectItem key={genre.id} value={genre.id}>
                            {genre.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select value={formData.language} onValueChange={(value) => handleInputChange("language", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="it">Italian</SelectItem>
                        <SelectItem value="pt">Portuguese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Enter audiobook description"
                    rows={4}
                    required
                  />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" onClick={addTag} size="icon" variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Publishing Details</CardTitle>
                <CardDescription>Additional publishing and pricing information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="isbn">ISBN</Label>
                    <Input
                      id="isbn"
                      value={formData.isbn}
                      onChange={(e) => handleInputChange("isbn", e.target.value)}
                      placeholder="Enter ISBN"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="publisher">Publisher</Label>
                    <Input
                      id="publisher"
                      value={formData.publisher}
                      onChange={(e) => handleInputChange("publisher", e.target.value)}
                      placeholder="Enter publisher name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="releaseDate">Release Date</Label>
                    <DatePicker
                      date={formData.releaseDate}
                      onDateChange={(date) => handleInputChange("releaseDate", date || new Date())}
                      placeholder="Select release date"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (Optional)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => handleInputChange("price", e.target.value)}
                        placeholder="0.00"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={formData.currency} onValueChange={(value) => handleInputChange("currency", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="CAD">CAD (C$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Exclusive Content</Label>
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        id="isExclusive"
                        checked={formData.isExclusive}
                        onCheckedChange={(checked) => handleInputChange("isExclusive", checked)}
                      />
                      <Label htmlFor="isExclusive" className="text-sm text-muted-foreground">
                        Mark as exclusive content
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !formData.title || !formData.narrator || !formData.genreId}>
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {uploadProgress > 0 ? `${uploadProgress}%` : "Creating..."}
              </div>
            ) : (
              "Create Audiobook"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}