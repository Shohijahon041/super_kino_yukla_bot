"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      addToast({ title: "Film o'chirildi", description: `"${deleteDialog.movie.title}" muvaffaqiyatli o'chirildi.`, variant: "success" });
      setDeleteDialog({ open: false, movie: null });
      fetchMovies();
    } catch {
      addToast({ title: "Xatolik", description: "Filmni o'chirishda xatolik yuz berdi.", variant: "destructive" });
    }
  };

  const toggleSelectAll = () => {
    if (selectedMovies.length === movieList.length) {
      setSelectedMovies([]);
    } else {
      setSelectedMovies(movieList.map((m) => m.id));
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, "success" | "warning" | "secondary" | "info"> = {
      published: "success",
      draft: "warning",
      archived: "secondary",
    };
    return map[status] || "secondary";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Filmlar</h1>
          <p className="text-gray-500 mt-1">Film kollektsiyasini boshqarish</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedMovies.length > 0 && (
            <Button variant="outline" size="sm">
              Eksport ({selectedMovies.length})
            </Button>
          )}
          <Link href="/movies/new">
            <Button variant="brand">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="mr-1.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Film Qo'shish
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden card-glow">
        <div className="p-4 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <Input
                placeholder="Film qidirish..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 max-w-sm"
              />
            </div>
            <Select
              options={[
                { value: "published", label: "Nashr etilgan" },
                { value: "draft", label: "Qoralama" },
                { value: "archived", label: "Arxivlangan" },
              ]}
              placeholder="Barcha holatlar"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-44"
            />
          </div>
        </div>

        <div className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 rounded-xl gradient-brand animate-pulse-soft" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/[0.04] hover:bg-transparent">
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedMovies.length === movieList.length && movieList.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded-lg border-gray-600 bg-gray-800 accent-brand-500"
                      />
                    </TableHead>
                    <TableHead>Film</TableHead>
                    <TableHead>Yil</TableHead>
                    <TableHead>Reyting</TableHead>
                    <TableHead>Ko'rishlar</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>Sana</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
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
                          className="rounded-lg border-gray-600 bg-gray-800 accent-brand-500"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-14 rounded-lg bg-gradient-to-br from-brand-500/20 to-purple-500/10 flex items-center justify-center text-xs border border-brand-500/10 shrink-0">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-400">
                              <rect x="2" y="2" width="20" height="20" rx="2.18" />
                              <line x1="7" y1="2" x2="7" y2="22" />
                              <line x1="17" y1="2" x2="17" y2="22" />
                              <line x1="2" y1="12" x2="22" y2="12" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-white">{movie.title}</p>
                            <p className="text-xs text-gray-500">{movie.genres?.[0]?.name || "N/A"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-400">{movie.year}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />
                          </svg>
                          {movie.rating}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-400 font-medium">{formatNumber(movie.views || 0)}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadge(movie.status)}>{movie.status}</Badge>
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">{formatDate(movie.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/movies/${movie.id}/edit`}>
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-red-400"
                            onClick={() => setDeleteDialog({ open: true, movie })}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <polyline points="3,6 5,6 21,6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between p-4 border-t border-white/[0.04]">
                <p className="text-sm text-gray-500">
                  Sahifa {currentPage} / {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Oldingi
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Keyingi
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filmi O'chirish</DialogTitle>
            <DialogDescription>
              &quot;{deleteDialog.movie?.title}&quot; ni o&apos;chirishni xohlaysizmi? Bu amal bekor qilib bo&apos;lmaydi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, movie: null })}>
              Bekor qilish
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              O'chirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
