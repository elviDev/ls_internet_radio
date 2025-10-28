"use client";

import React, { useState } from "react";
import { ArchiveCard } from "./archive-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Search } from "lucide-react";
import { searchArchives } from "@/app/archives/actions";
import { useToast } from "@/hooks/use-toast";
import type { ArchiveData } from "@/app/archives/actions";

interface ArchivesListProps {
  initialArchives: ArchiveData[];
  title?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  availableCategories?: string[];
  viewMode?: "grid" | "list" | "horizontal";
}

export function ArchivesList({
  initialArchives,
  title = "Archives",
  showSearch = true,
  showFilters = true,
  availableCategories = [],
  viewMode = "grid",
}: ArchivesListProps) {
  const [archives, setArchives] = useState<ArchiveData[]>(initialArchives);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      const result = await searchArchives(searchTerm);
      if (result.success) {
        setArchives(result.data);
      } else {
        toast({
          title: "Search failed",
          description: "Failed to search archives. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const filteredArchives = archives
    .filter((archive) => {
      if (selectedCategory === "all") return true;
      return archive.category === selectedCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "duration":
          const aDuration = parseInt(a.duration) || 0;
          const bDuration = parseInt(b.duration) || 0;
          return bDuration - aDuration;
        case "popularity":
          return (b.playCount || 0) - (a.playCount || 0);
        case "date":
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

  const getGridClasses = () => {
    switch (viewMode) {
      case "list":
        return "space-y-4";
      case "horizontal":
        return "grid grid-cols-1 md:grid-cols-2 gap-6";
      case "grid":
      default:
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6";
    }
  };

  return (
    <div className="space-y-6">
      {title && <h2 className="text-2xl font-bold">{title}</h2>}

      {showSearch && (
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search archives..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={isSearching}>
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </form>

          {showFilters && (
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {availableCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date (Newest)</SelectItem>
                  <SelectItem value="title">Title (A-Z)</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                  <SelectItem value="popularity">Popularity</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
                <span className="sr-only">Filter</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          <p className="text-muted-foreground mt-2">Loading archives...</p>
        </div>
      ) : filteredArchives.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No archives found</p>
          {searchTerm && (
            <p className="text-sm text-muted-foreground mt-2">
              Try adjusting your search terms or filters
            </p>
          )}
        </div>
      ) : (
        <div className={getGridClasses()}>
          {filteredArchives.map((archive) => (
            <ArchiveCard
              key={archive.id}
              archive={archive}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}

      {/* Pagination placeholder */}
      {filteredArchives.length > 0 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button variant="outline" size="sm">
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-brand-600 text-white hover:bg-brand-700"
          >
            1
          </Button>
          <Button variant="outline" size="sm">
            2
          </Button>
          <Button variant="outline" size="sm">
            3
          </Button>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </div>
      )}
    </div>
  );
}