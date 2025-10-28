"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { FileText, Upload, Save, Download } from "lucide-react"


export default function TranscriptPage() {
  const params = useParams()
  const router = useRouter()
  const audiobookId = params.audiobookId as string
  const chapterId = params.chapterId as string

  const [transcriptTab, setTranscriptTab] = useState("write")
  const [transcriptText, setTranscriptText] = useState("")
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null)
  const [isPublished, setIsPublished] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [chapterTitle, setChapterTitle] = useState("Chapter")

  useEffect(() => {
    const fetchTranscript = async () => {
      try {
        const response = await fetch(`/api/admin/audiobooks/${audiobookId}/chapters`)
        if (response.ok) {
          const chapters = await response.json()
          const chapter = chapters.find((c: any) => c.id === chapterId)
          if (chapter) {
            setTranscriptText(chapter.transcript || "")
            setChapterTitle(chapter.title || "Chapter")
          }
        }
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTranscript()
  }, [chapterId, audiobookId])

  const handleTranscriptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setTranscriptFile(file)

      // Read the file content
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setTranscriptText(event.target.result as string)
        }
      }
      reader.readAsText(file)
    }
  }

  const handleSaveTranscript = async (publish = false) => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/audiobooks/${audiobookId}/chapters/${chapterId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transcript: transcriptText
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save transcript')
      }

      if (publish) {
        setIsPublished(true)
      }

      router.push(`/dashboard/audiobooks/${audiobookId}/chapters`)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const downloadTranscript = () => {
    if (!transcriptText) return

    const blob = new Blob([transcriptText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${chapterTitle}_transcript.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Chapter Transcript</h1>
            <p className="text-slate-500 mt-1">{chapterTitle}</p>
          </div>
          <Button variant="outline" onClick={() => router.push(`/dashboard/audiobooks/${audiobookId}/chapters`)}>
            Back to Chapters
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Manage Transcript
            </CardTitle>
            <CardDescription>Create, edit, or upload a transcript for this chapter</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading transcript...</div>
            ) : (
              <>
                <Tabs value={transcriptTab} onValueChange={setTranscriptTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="write">Write Transcript</TabsTrigger>
                    <TabsTrigger value="upload">Upload Transcript</TabsTrigger>
                  </TabsList>

                  <TabsContent value="write" className="space-y-4">
                    <Textarea
                      placeholder="Type or paste your transcript here..."
                      className="min-h-[400px] font-mono text-sm"
                      value={transcriptText}
                      onChange={(e) => setTranscriptText(e.target.value)}
                    />
                  </TabsContent>

                  <TabsContent value="upload" className="space-y-4">
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        id="transcriptFile"
                        accept=".txt,.srt,.vtt"
                        onChange={handleTranscriptFileChange}
                        className="hidden"
                      />

                      {!transcriptFile ? (
                        <div className="space-y-4">
                          <div className="flex justify-center">
                            <Upload className="h-10 w-10 text-slate-400" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-500 mb-2">Upload a transcript file (.txt, .srt, .vtt)</p>
                            <Button
                              variant="outline"
                              onClick={() => document.getElementById("transcriptFile")?.click()}
                            >
                              Select Transcript File
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {transcriptFile.name}
                          </Badge>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setTranscriptFile(null)
                            }}
                          >
                            Change File
                          </Button>
                        </div>
                      )}
                    </div>

                    {transcriptFile && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium mb-2">Preview:</h3>
                        <div className="bg-slate-50 p-4 rounded-md border border-slate-200 max-h-[300px] overflow-y-auto">
                          <pre className="text-sm whitespace-pre-wrap">{transcriptText}</pre>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isPublished">Publish Transcript</Label>
                    <Switch id="isPublished" checked={isPublished} onCheckedChange={setIsPublished} />
                  </div>
                  <p className="text-sm text-slate-500">
                    {isPublished
                      ? "Transcript will be published and available to users"
                      : "Transcript will be saved as a draft"}
                  </p>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <div>
              {transcriptText && (
                <Button variant="outline" onClick={downloadTranscript} className="flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push(`/dashboard/audiobooks/${audiobookId}/chapters`)}>
                Cancel
              </Button>
              <Button
                onClick={() => handleSaveTranscript(isPublished)}
                disabled={isSaving || !transcriptText}
                className="flex items-center gap-2"
              >
                {isSaving ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {isPublished ? "Save & Publish" : "Save as Draft"}
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
