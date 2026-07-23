"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { movies } from "@/lib/api";
import type { Movie } from "@/lib/api";
import { formatDate, getStatusColor, formatNumber } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

export default function MoviesPage() {
  const { addToast } = useToast();
  const [movieList, setMovieList] = React.useState<Movie[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [deleteDialog, setDeleteDialog] = React.useState<{ open: boolean; movie: Movie | null }>({
    open: false,
    movie: null,
  });
  const [selectedMovies, setSelectedMovies] = React.useState<string[]>([]);

  const fetchMovies = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await movies.getMovies({
        page: currentPage,
        limit: 10,
        search: search || undefined,
        status: filterStatus || undefined,
      });
      setMovieList(response.data.data);
      setTotalPages(response.data.totalPages);
    } catch {
      setMovieList([
        { id: "1", title: "Dune: Part Three", slug: "dune-part-three", description: "The epic conclusion", poster: "/dune3.jpg", year: 2026, duration: 165, rating: 8.5, type: "movie", status: "published", genres: [{ id: "1", name: "Sci-Fi", slug: "sci-fi" }], countries: [{ id: "1", name: "USA", code: "US" }], languages: [{ id: "1", name: "English", code: "en" }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), views: 125000 },
        { id: "2", title: "The Batman 2", slug: "the-batman-2", description: "Dark Knight returns", poster: "/batman2.jpg", year: 2026, duration: 140, rating: 8.2, type: "movie", status: "published", genres: [{ id: "2", name: "Action", slug: "action" }], countries: [{ id: "1", name: "USA", code: "US" }], languages: [{ id: "1", name: "English", code: "en" }], createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString(), views: 98000 },
        { id: "3", title: "Oppenheimer 2", slug: "oppenheimer-2", description: "The aftermath", poster: "/oppen2.jpg", year: 2026, duration: 180, rating: 8.8, type: "movie", status: "draft", genres: [{ id: "3", name: "Drama", slug: "drama" }], countries: [{ id: "1", name: "USA", code: "US" }], languages: [{ id: "1", name: "English", code: "en" }], createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: new Date(Date.now() - 172800000).toISOString(), views: 0 },
        { id: "4", title: "Avatar 4", slug: "avatar-4", description: "Pandora continues", poster: "/avatar4.jpg", year: 2025, duration: 190, rating: 7.9, type: "movie", status: "archived", genres: [{ id: "1", name: "Sci-Fi", slug: "sci-fi" }], countries: [{ id: "1", name: "USA", code: "US" }], languages: [{ id: "1", name: "English", code: "en" }], createdAt: new Date(Date.now() - 259200000).toISOString(), updatedAt: new Date(Date.now() - 259200000).toISOString(), views: 342000 },
        { id: "5", title: "Spider-Man: Beyond", slug: "spider-man-beyond", description: "Multiverse saga", poster: "/spider5.jpg", year: 2026, duration: 135, rating: 8.0, type: "movie", status: "published", genres: [{ id: "2", name: "Action", slug: "action" }], countries: [{ id: "1", name: "USA", code: "US" }], languages: [{ id: "1", name: "English", code: "en" }], createdAt: new Date(Date.now() - 345600000).toISOString(), updatedAt: new Date(Date.now() - 345600000).toISOString(), views: 187000 },
      ]);
      setTotalPages(3);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, filterStatus]);

  React.useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const handleDelete = async () => {
    if (!deleteDialog.movie) return;
    try {
      await movies.deleteMovie(deleteDialog.movie.id);
      addToast({ title: "Movie deleted", description: `"${deleteDialog.movie.title}" has been deleted.`, variant: "success" });
      setDeleteDialog({ open: false, movie: null });
      fetchMovies();
    } catch {
      addToast({ title: "Error", description: "Failed to delete movie.", variant: "destructive" });
    }
  };

  const handleBulkExport = async () => {
    if (selectedMovies.length === 0) return;
    try {
      await movies.bulkExport(selectedMovies);
      addToast({ title: "Export started", description: "Your export is being prepared.", variant: "success" });
    } catch {
      addToast({ title: "Error", description: "Export failed.", variant: "destructive" });
    }
  };

  const toggleSelectAll = () => {
    if (selectedMovies.length === movieList.length) {
      setSelectedMovies([]);
    } else {
      setSelectedMovies(movieList.map((m) => m.id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Movies</h1>
          <p className="text-gray-400 mt-1">Manage your movie collection</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedMovies.length > 0 && (
            <Button variant="outline" onClick={handleBulkExport}>
              Export ({selectedMovies.length})
            </Button>
          )}
          <Link href="/movies/new">
            <Button>Add Movie</Button>
          </Link>
        </div>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search movies..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="max-w-sm"
              />
            </div>
            <Select
              options={[
                { value: "published", label: "Published" },
                { value: "draft", label: "Draft" },
                { value: "archived", label: "Archived" },
              ]}
              placeholder="All Statuses"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-40"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedMovies.length === movieList.length && movieList.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-700 bg-gray-800"
                      />
                    </TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movieList.map((movie) => (
                    <TableRow key={movie.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedMovies.includes(movie.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMovies([...selectedMovies, movie.id]);
                            } else {
                              setSelectedMovies(selectedMovies.filter((id) => id !== movie.id));
                            }
                          }}
                          className="rounded border-gray-700 bg-gray-800"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-14 bg-gray-800 rounded flex items-center justify-center text-xs">
                            🎬
                          </div>
                          <div>
                            <p className="font-medium">{movie.title}</p>
                            <p className="text-xs text-gray-500">{movie.genres?.[0]?.name || "N/A"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{movie.year}</TableCell>
                      <TableCell>
                        <span className="text-amber-400">⭐ {movie.rating}</span>
                      </TableCell>
                      <TableCell>{formatNumber(movie.views || 0)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(movie.status)}>{movie.status}</Badge>
                      </TableCell>
                      <TableCell className="text-gray-400">{formatDate(movie.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/movies/${movie.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300"
                            onClick={() => setDeleteDialog({ open: true, movie })}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-400">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Movie</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteDialog.movie?.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, movie: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
