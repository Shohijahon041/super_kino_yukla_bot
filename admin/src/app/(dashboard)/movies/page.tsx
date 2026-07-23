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
import { movies } from "@/lib/api";
import { formatDate, formatNumber } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

interface ApiMovie {
  id: string;
  code: number;
  title: string;
  slug: string;
  year: number;
  rating: number;
  viewCount: number;
  isFeatured: boolean;
  poster: string | null;
  genres: { genre: { id: string; name: string; slug: string } }[];
  countries: { country: { id: string; name: string; code: string } }[];
  createdAt: string;
  description?: string;
}

export default function MoviesPage() {
  const { addToast } = useToast();
  const [movieList, setMovieList] = React.useState<ApiMovie[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const [deleteDialog, setDeleteDialog] = React.useState<{ open: boolean; movie: ApiMovie | null }>({
    open: false,
    movie: null,
  });

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  React.useEffect(() => {
    let cancelled = false;
    async function fetchMovies() {
      setLoading(true);
      setError(null);
      try {
        const response = await movies.getMovies({
          page: currentPage,
          limit: 20,
          search: debouncedSearch || undefined,
        });
        if (!cancelled) {
          const payload = response.data as any;
          setMovieList(payload.data);
          setTotalPages(payload.totalPages);
          setTotalCount(payload.total);
        }
      } catch {
        if (!cancelled) {
          setError("Filmlarni yuklashda xatolik yuz berdi. Keyinroq qayta urinib ko'ring.");
          setMovieList([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    fetchMovies();
    return () => { cancelled = true; };
  }, [currentPage, debouncedSearch]);

  const handleDelete = async () => {
    if (!deleteDialog.movie) return;
    try {
      await movies.deleteMovie(deleteDialog.movie.id);
      addToast({ title: "Film o'chirildi", description: `"${deleteDialog.movie.title}" muvaffaqiyatli o'chirildi.`, variant: "success" });
      setDeleteDialog({ open: false, movie: null });
      setMovieList((prev) => {
        const next = prev.filter((m) => m.id !== deleteDialog.movie!.id);
        if (next.length === 0 && currentPage > 1) {
          setCurrentPage((p) => p - 1);
        }
        return next;
      });
    } catch {
      addToast({ title: "Xatolik", description: "Filmni o'chirishda xatolik yuz berdi.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Filmlar</h1>
          <p className="text-gray-500 mt-1">Film kollektsiyasini boshqarish</p>
        </div>
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
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 max-w-sm"
              />
            </div>
            {!loading && !error && (
              <span className="text-sm text-gray-500">{totalCount} ta film</span>
            )}
          </div>
        </div>

        <div className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-xl gradient-brand animate-pulse-soft" />
                <p className="text-sm text-gray-500">Yuklanmoqda...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-400">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-sm text-red-400">{error}</p>
              <Button variant="outline" size="sm" onClick={() => { setError(null); setLoading(true); }}>
                Qayta urinish
              </Button>
            </div>
          ) : movieList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-600">
                <rect x="2" y="2" width="20" height="20" rx="2.18" />
                <line x1="7" y1="2" x2="7" y2="22" />
                <line x1="17" y1="2" x2="17" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
              </svg>
              <p className="text-sm text-gray-500">Hech narsa topilmadi</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/[0.04] hover:bg-transparent">
                    <TableHead>Film</TableHead>
                    <TableHead>Yil</TableHead>
                    <TableHead>Reyting</TableHead>
                    <TableHead>Ko'rishlar</TableHead>
                    <TableHead>Janrlar</TableHead>
                    <TableHead>Sana</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movieList.map((movie) => (
                    <TableRow key={movie.id}>
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
                            <p className="text-xs text-gray-500">#{movie.code}</p>
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
                      <TableCell className="text-gray-400 font-medium">{formatNumber(movie.viewCount || 0)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {movie.genres?.slice(0, 2).map((g) => (
                            <Badge key={g.genre.id} variant="secondary" className="text-[10px]">
                              {g.genre.name}
                            </Badge>
                          ))}
                          {movie.genres?.length > 2 && (
                            <Badge variant="secondary" className="text-[10px]">
                              +{movie.genres.length - 2}
                            </Badge>
                          )}
                        </div>
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
