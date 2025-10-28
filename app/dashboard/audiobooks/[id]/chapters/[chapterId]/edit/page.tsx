"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText, Save, BookOpen, Clock, Music } from "lucide-react"
import { getChapter, updateChapter } from "@/app/actions"

export default function EditChapterPage() {
  const params = useParams()
  const router = useRouter()
  const audiobookId = params.audiobookId as string
  const chapterId = params.chapterId as string
  const audioRef = useRef<HTMLAudioElement>(null)

  const [title, setTitle] = useState("")
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [trackNumber, setTrackNumber] = useState<number>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDraft, setIsDraft] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [originalFileName, setOriginalFileName] = useState("")

  useEffect(() => {
    const fetchChapter = async () => {
      try {
        // This would be implemented in a server action
        const chapter = await getChapter(chapterId)

        setTitle(chapter.title)
        setAudioUrl(chapter.audioFile)
        setDuration(chapter.duration)
        setTrackNumber(chapter.trackNumber)
        setIsDraft(chapter.isDraft)
        setOriginalFileName(chapter.audioFile.split("/").pop() || "audio-file")
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchChapter()
  }, [chapterId])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAudioFile(file)
      const newAudioUrl = URL.createObjectURL(file)
      setAudioUrl(newAudioUrl)

      // Create audio element to get duration
      const audio = new Audio(newAudioUrl)
      audio.onloadedmetadata = () => {
        setDuration(Math.floor(audio.duration))
      }
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || (!audioFile && !audioUrl) || !duration) {
      return
    }

    setIsSubmitting(true)

    try {
      // This would be implemented in a server action
      await updateChapter({
        id: chapterId,
        title,
        audioFile,
        duration,
        trackNumber,
        audiobookId,
        isDraft,
        // Only include the audioUrl if no new file was uploaded
        currentAudioUrl: audioFile ? null : audioUrl,
      })

      router.push(`/dashboard/audiobooks/${audiobookId}/chapters`)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading chapter data...</h2>
          <p className="text-slate-500">Please wait while we fetch the chapter information.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Edit Chapter</h1>
            <p className="text-slate-500 mt-1">Update chapter details and audio</p>
          </div>
          <Button variant="outline" onClick={() => router.push(`/dashboard/audiobooks/${audiobookId}/chapters`)}>
            Back to Chapters
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chapter Details Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Chapter Details
              </CardTitle>
              <CardDescription>Update basic information about the chapter</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Chapter Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter chapter title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trackNumber">Track Number</Label>
                <Input
                  id="trackNumber"
                  type="number"
                  value={trackNumber}
                  onChange={(e) => setTrackNumber(Number(e.target.value))}
                  min={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="isDraft">Save as Draft</Label>
                  <Switch id="isDraft" checked={isDraft} onCheckedChange={setIsDraft} />
                </div>
                <p className="text-sm text-slate-500">
                  {isDraft ? "Chapter will be saved as a draft" : "Chapter will be published immediately"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Audio Upload Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Audio File
              </CardTitle>
              <CardDescription>Update the audio file for this chapter</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
                <input type="file" id="audioFile" accept="audio/*" onChange={handleFileChange} className="hidden" />

                {!audioUrl ? (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <Upload className="h-10 w-10 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-2">
                        Drag and drop your audio file here, or click to browse
                      </p>
                      <Button variant="outline" onClick={() => document.getElementById("audioFile")?.click()}>
                        Select Audio File
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <audio ref={audioRef} controls src={audioUrl} className="w-full max-w-md" />
                    </div>

                    <div className="flex items-center justify-center gap-4">
                      {duration && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(duration)}
                        </Badge>
                      )}

                      <Badge variant="outline" className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {audioFile ? audioFile.name : originalFileName}
                      </Badge>
                    </div>

                    <Button variant="outline" size="sm" onClick={() => document.getElementById("audioFile")?.click()}>
                      Change File
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transcript Management Card */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Chapter Transcript
              </CardTitle>
              <CardDescription>Manage the transcript for this chapter</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <p className="text-sm text-slate-600 mb-4">
                  Add or edit the transcript for better accessibility and searchability
                </p>
                <Button
                  onClick={() => router.push(`/dashboard/audiobooks/${audiobookId}/chapters/${chapterId}/transcript/edit`)}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Manage Transcript
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <Button variant="outline" onClick={() => router.push(`/dashboard/audiobooks/${audiobookId}/chapters`)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !title || (!audioFile && !audioUrl)}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? "Saving..." : isDraft ? "Save as Draft" : "Publish Chapter"}
          </Button>
        </div>
      </div>
    </div>
  )
}
