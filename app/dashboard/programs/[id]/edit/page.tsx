"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

type Staff = {
  id: string
  firstName: string
  lastName: string
  email: string
}

type Genre = {
  id: string
  name: string
}

type Asset = {
  id: string
  originalName: string
  url: string
  type: string
}

type Program = {
  id: string
  title: string
  description: string
  category: string
  schedule: string
  image?: string
  status: string
  hostId: string
  genreId?: string
}

export default function EditProgramPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [staff, setStaff] = useState<Staff[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedImage, setSelectedImage] = useState<string>("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    schedule: "",
    hostId: "",
    genreId: "",
    status: "ACTIVE"
  })

  useEffect(() => {
    fetchProgram()
    fetchStaff()
    fetchGenres()
    fetchAssets()
  }, [])

  const fetchProgram = async () => {
    try {
      const response = await fetch(`/api/admin/programs/${params.id}`)
      if (response.ok) {
        const program: Program = await response.json()
        setFormData({
          title: program.title,
          description: program.description,
          category: program.category,
          schedule: program.schedule,
          hostId: program.hostId,
          genreId: program.genreId || "",
          status: program.status
        })
        if (program.image) {
          setSelectedImage(program.image)
        }
      }
    } catch (error) {
      console.error("Failed to fetch program:", error)
      toast({
        title: "Error",
        description: "Failed to load program",
        variant: "destructive"
      })
    } finally {
      setInitialLoading(false)
    }
  }

  const fetchStaff = async () => {
    try {
      const response = await fetch("/api/admin/staff")
      if (response.ok) {
        const data = await response.json()
        setStaff(data.staff)
      }
    } catch (error) {
      console.error("Failed to fetch staff:", error)
    }
  }

  const fetchGenres = async () => {
    try {
      const response = await fetch("/api/genres")
      if (response.ok) {
        const data = await response.json()
        setGenres(data.genres)
      }
    } catch (error) {
      console.error("Failed to fetch genres:", error)
    }
  }

  const fetchAssets = async () => {
    try {
      const response = await fetch("/api/admin/assets?type=IMAGE")
      if (response.ok) {
        const data = await response.json()
        setAssets(data.assets)
      }
    } catch (error) {
      console.error("Failed to fetch assets:", error)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setSelectedImage("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let imageUrl = selectedImage

      // Upload new file if selected
      if (uploadedFile) {
        const uploadFormData = new FormData()
        uploadFormData.append("file", uploadedFile)
        uploadFormData.append("type", "IMAGE")
        uploadFormData.append("description", `Cover image for ${formData.title}`)

        const uploadResponse = await fetch("/api/admin/assets/upload", {
          method: "POST",
          body: uploadFormData
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          imageUrl = uploadData.url
        }
      }

      const response = await fetch(`/api/admin/programs/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          image: imageUrl
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Program updated successfully"
        })
        router.push("/dashboard/programs")
      } else {
        throw new Error("Failed to update program")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update program",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/4"></div>
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-10 bg-muted rounded"></div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-muted rounded"></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Program</h1>
        <p className="text-muted-foreground">Update program details</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Program Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TALK_SHOW">Talk Show</SelectItem>
                        <SelectItem value="MUSIC">Music</SelectItem>
                        <SelectItem value="TECHNOLOGY">Technology</SelectItem>
                        <SelectItem value="BUSINESS">Business</SelectItem>
                        <SelectItem value="INTERVIEW">Interview</SelectItem>
                        <SelectItem value="SPORTS">Sports</SelectItem>
                        <SelectItem value="NEWS">News</SelectItem>
                        <SelectItem value="ENTERTAINMENT">Entertainment</SelectItem>
                        <SelectItem value="EDUCATION">Education</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="schedule">Schedule</Label>
                  <Input
                    id="schedule"
                    value={formData.schedule}
                    onChange={(e) => setFormData(prev => ({ ...prev, schedule: e.target.value }))}
                    placeholder="e.g., Weekdays, 9AM - 11AM"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="host">Host</Label>
                    <Select value={formData.hostId} onValueChange={(value) => setFormData(prev => ({ ...prev, hostId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select host" />
                      </SelectTrigger>
                      <SelectContent>
                        {staff?.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.firstName} {member.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="genre">Genre (Optional)</Label>
                    <Select value={formData.genreId} onValueChange={(value) => setFormData(prev => ({ ...prev, genreId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select genre" />
                      </SelectTrigger>
                      <SelectContent>
                        {genres?.map((genre) => (
                          <SelectItem key={genre.id} value={genre.id}>
                            {genre.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cover Image</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="assets" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="assets">From Assets</TabsTrigger>
                    <TabsTrigger value="upload">Upload New</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="assets" className="space-y-4">
                    {selectedImage && (
                      <div className="mb-4">
                        <Label>Current Selection</Label>
                        <div className="relative w-full h-32 border rounded-lg overflow-hidden">
                          <Image
                            src={selectedImage}
                            alt="Selected image"
                            fill
                            className="object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => setSelectedImage("")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                      {assets?.map((asset) => (
                        <div
                          key={asset.id}
                          className={`relative cursor-pointer border-2 rounded-lg overflow-hidden ${
                            selectedImage === asset.url ? "border-primary" : "border-muted"
                          }`}
                          onClick={() => {
                            setSelectedImage(asset.url)
                            setUploadedFile(null)
                            setPreviewUrl("")
                          }}
                        >
                          <Image
                            src={asset.url}
                            alt={asset.originalName}
                            width={100}
                            height={100}
                            className="w-full h-20 object-cover"
                          />
                          {selectedImage === asset.url && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <Badge>Selected</Badge>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="upload" className="space-y-4">
                    {previewUrl ? (
                      <div className="relative">
                        <Label>Upload Preview</Label>
                        <div className="relative w-full h-32 border rounded-lg overflow-hidden mt-2">
                          <Image
                            src={previewUrl}
                            alt="Preview"
                            fill
                            className="object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setUploadedFile(null)
                              setPreviewUrl("")
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="file-upload"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload image
                          </p>
                        </label>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Updating..." : "Update Program"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}