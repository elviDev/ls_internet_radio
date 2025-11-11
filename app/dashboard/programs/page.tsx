"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Radio,
  User,
  Calendar,
  Clock,
  Tv,
  ExternalLink
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Program = {
  id: string
  title: string
  slug: string
  description: string
  category: string
  schedule: string
  image?: string
  status: string
  host: {
    firstName: string
    lastName: string
    email: string
  }
  genre?: {
    name: string
  }
  _count: {
    episodes: number
    broadcasts: number
  }
  createdAt: string
  updatedAt: string
}

const categoryColors = {
  TALK_SHOW: "bg-emerald-100 text-emerald-800",
  MUSIC: "bg-amber-100 text-amber-800",
  TECHNOLOGY: "bg-green-100 text-green-800",
  BUSINESS: "bg-yellow-100 text-yellow-800",
  INTERVIEW: "bg-teal-100 text-teal-800",
  SPORTS: "bg-lime-100 text-lime-800",
  NEWS: "bg-gray-100 text-gray-800",
  ENTERTAINMENT: "bg-amber-100 text-amber-800",
  EDUCATION: "bg-emerald-100 text-emerald-800"
}

const statusColors = {
  ACTIVE: "bg-emerald-100 text-emerald-800",
  INACTIVE: "bg-amber-100 text-amber-800",
  ARCHIVED: "bg-gray-100 text-gray-800"
}

export default function ProgramsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchPrograms()
  }, [currentPage, search, categoryFilter, statusFilter])

  const fetchPrograms = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        perPage: "12",
        search,
        category: categoryFilter,
        status: statusFilter
      })

      const response = await fetch(`/api/admin/programs?${params}`)
      if (response.ok) {
        const data = await response.json()
        setPrograms(data.programs)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error("Failed to fetch programs:", error)
      toast({
        title: "Error",
        description: "Failed to fetch programs",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this program?")) return

    try {
      const response = await fetch(`/api/admin/programs/${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Program deleted successfully"
        })
        fetchPrograms()
      } else {
        throw new Error("Failed to delete")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete program",
        variant: "destructive"
      })
    }
  }

  const formatCategory = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-emerald-900">Programs</h1>
          <p className="text-emerald-600">
            Manage your radio programs and shows
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/programs/new")} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" />
          New Program
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search programs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
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

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Programs Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : programs.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => (
              <Card key={program.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-1">{program.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge className={categoryColors[program.category as keyof typeof categoryColors]}>
                          {formatCategory(program.category)}
                        </Badge>
                        <Badge className={statusColors[program.status as keyof typeof statusColors]}>
                          {program.status}
                        </Badge>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => router.push(`/programs/${program.slug}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/programs/${program.id}`)} title="Manage Episodes">
                        <Radio className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/broadcasts?programId=${program.id}`)} title="View Broadcasts">
                        <Tv className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/programs/${program.id}/edit`)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(program.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {program.description}
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{program.host.firstName} {program.host.lastName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{program.schedule}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Radio className="h-4 w-4 text-muted-foreground" />
                      <span>{program._count.episodes} episodes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tv className="h-4 w-4 text-muted-foreground" />
                      <span>{program._count.broadcasts} broadcasts</span>
                    </div>
                    {program.genre && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Genre:</span>
                        <span>{program.genre.name}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Radio className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No programs found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by creating your first program
            </p>
            <Button onClick={() => router.push("/dashboard/programs/new")} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Program
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}