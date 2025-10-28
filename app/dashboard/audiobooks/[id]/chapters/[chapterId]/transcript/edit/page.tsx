"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save, FileText, Clock, Eye, Download, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Chapter = {
  id: string
  title: string
  duration: number
  trackNumber: number
  transcript?: string
}

type Audiobook = {
  id: string
  title: string
  transcription?: {
    id: string
    content: string
    language: string
    format: string
    isEditable: boolean
    lastEditedAt?: string
  }
}

export default function TranscriptEditPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const audiobookId = params.id as string
  const chapterId = params.chapterId as string
  
  const [audiobook, setAudiobook] = useState<Audiobook | null>(null)
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [transcript, setTranscript] = useState("")
  const [language, setLanguage] = useState("en")
  const [format, setFormat] = useState("plain_text")
  const [isEditable, setIsEditable] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [audiobookId, chapterId])

  useEffect(() => {
    const words = transcript.trim().split(/\s+/).filter(word => word.length > 0)
    setWordCount(words.length)
  }, [transcript])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch audiobook details
      const audiobookResponse = await fetch(`/api/admin/audiobooks/${audiobookId}`)
      if (audiobookResponse.ok) {
        const audiobookData = await audiobookResponse.json()
        setAudiobook(audiobookData)
      }

      // Fetch chapter details
      const chaptersResponse = await fetch(`/api/admin/audiobooks/${audiobookId}/chapters`)
      if (chaptersResponse.ok) {
        const chaptersData = await chaptersResponse.json()
        const currentChapter = chaptersData.find((c: Chapter) => c.id === chapterId)
        if (currentChapter) {
          setChapter(currentChapter)
          setTranscript(currentChapter.transcript || "")
        }
      }

      // Fetch existing transcription if available
      const transcriptionResponse = await fetch(`/api/admin/audiobooks/${audiobookId}/transcription`)
      if (transcriptionResponse.ok) {
        const transcriptionData = await transcriptionResponse.json()
        if (transcriptionData) {
          setLanguage(transcriptionData.language || "en")
          setFormat(transcriptionData.format || "plain_text")
          setIsEditable(transcriptionData.isEditable !== false)
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Error",
        description: "Failed to load transcript data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTranscriptChange = (value: string) => {
    setTranscript(value)
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)

      // Update chapter transcript
      const chapterResponse = await fetch(`/api/admin/audiobooks/${audiobookId}/chapters/${chapterId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transcript
        })
      })

      if (!chapterResponse.ok) {
        throw new Error('Failed to update chapter transcript')
      }

      // Update audiobook transcription settings
      const transcriptionResponse = await fetch(`/api/admin/audiobooks/${audiobookId}/transcription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: transcript,
          language,
          format,
          isEditable
        })
      })

      if (!transcriptionResponse.ok) {
        throw new Error('Failed to update transcription settings')
      }

      setHasChanges(false)
      toast({
        title: "Success",
        description: "Transcript saved successfully"
      })
    } catch (error) {
      console.error('Error saving transcript:', error)
      toast({
        title: "Error",
        description: "Failed to save transcript",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAutoGenerate = async () => {
    toast({
      title: "Feature Coming Soon",
      description: "Auto-generation of transcripts will be available soon",
    })
  }

  const handleImportFile = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.txt,.srt,.vtt'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const content = e.target?.result as string
          setTranscript(content)
          setHasChanges(true)
          toast({
            title: "Success",
            description: "Transcript imported successfully"
          })
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const handleExport = () => {
    const blob = new Blob([transcript], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${chapter?.title || 'chapter'}-transcript.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}` 
                     : `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading transcript...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Edit Transcript</h1>
          <p className="text-muted-foreground">
            {audiobook?.title} • Chapter {chapter?.trackNumber}: {chapter?.title}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImportFile}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={!transcript}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Transcript Editor */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Transcript Editor
                  </CardTitle>
                  <CardDescription>
                    Edit the transcript for this chapter
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{wordCount} words</span>
                  {hasChanges && <Badge variant="secondary">Unsaved changes</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  value={transcript}
                  onChange={(e) => handleTranscriptChange(e.target.value)}
                  placeholder="Enter or paste the transcript here..."
                  className="min-h-[500px] font-mono text-sm"
                  disabled={!isEditable}
                />
                
                {!transcript && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No transcript available</p>
                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" onClick={handleImportFile}>
                        <Upload className="h-4 w-4 mr-2" />
                        Import File
                      </Button>
                      <Button variant="outline" onClick={handleAutoGenerate}>
                        <FileText className="h-4 w-4 mr-2" />
                        Auto Generate
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Panel */}
        <div className="space-y-6">
          {/* Chapter Info */}
          <Card>
            <CardHeader>
              <CardTitle>Chapter Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Title</Label>
                <p className="text-sm text-muted-foreground">{chapter?.title}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Track Number</Label>
                <p className="text-sm text-muted-foreground">Chapter {chapter?.trackNumber}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Duration</Label>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{chapter ? formatDuration(chapter.duration) : "0:00"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transcript Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Transcript Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
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

              <div className="space-y-2">
                <Label htmlFor="format">Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plain_text">Plain Text</SelectItem>
                    <SelectItem value="srt">SRT Subtitles</SelectItem>
                    <SelectItem value="vtt">WebVTT</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Allow Editing</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow future edits to this transcript
                  </p>
                </div>
                <Switch
                  checked={isEditable}
                  onCheckedChange={setIsEditable}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full" onClick={handleAutoGenerate}>
                <FileText className="h-4 w-4 mr-2" />
                Auto Generate
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push(`/dashboard/audiobooks/${audiobookId}/chapters/${chapterId}`)}>
                <Eye className="h-4 w-4 mr-2" />
                Preview Chapter
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}