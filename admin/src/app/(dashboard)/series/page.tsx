"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { series } from "@/lib/api";
import type { Series } from "@/lib/api";
import { formatDate, getStatusColor, formatNumber } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

export default function SeriesPage() {
  const { addToast } = useToast();
  const [seriesList, setSeriesList] = React.useState<Series[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [deleteDialog, setDeleteDialog] = React.useState<{ open: boolean; series: Series | null }>({
    open: false,
    series: null,
  });

  const fetchSeries = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await series.getSeries({
        page: currentPage,
        limit: 10,
        search: search || undefined,
        status: filterStatus || undefined,
      });
      setSeriesList(response.data.data);
      setTotalPages(response.data.totalPages);
    } catch {
      setSeriesList([
        { id: "1", title: "The Last of Us Season 3", slug: "tlou-s3", description: "Post-apocalyptic journey continues", poster: "/tlou3.jpg", year: 2026, status: "ongoing", rating: 9.1, genres: [{ id: "1", name: "Drama", slug: "drama" }], countries: [{ id: "1", name: "USA", code: "US" }], languages: [{ id: "1", name: "English", code: "en" }], seasons: [{ id: "s1", number: 1, title: "Season 3", episodes: [] }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), views: 890000 },
        { id: "2", title: "Stranger Things 5", slug: "st5", description: "The final season", poster: "/st5.jpg", year: 2025, status: "completed", rating: 8.8, genres: [{ id: "2", name: "Sci-Fi", slug: "sci-fi" }], countries: [{ id: "1", name: "USA", code: "US" }], languages: [{ id: "1", name: "English", code: "en" }], seasons: [{ id: "s1", number: 1, title: "Season 5", episodes: [] }], createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString(), views: 1250000 },
        { id: "3", title: "Wednesday Season 2", slug: "wed2", description: "More spooky adventures", poster: "/wed2.jpg", year: 2026, status: "upcoming", rating: 8.5, genres: [{ id: "3", name: "Horror", slug: "horror" }], countries: [{ id: "2", name: "United Kingdom", code: "GB" }], languages: [{ id: "1", name: "English", code: "en" }], seasons: [{ id: "s1", number: 1, title: "Season 2", episodes: [] }], createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: new Date(Date.now() - 172800000).toISOString(), views: 0 },
        { id: "4", title: "Squid Game Season 3", slug: "sg3", description: "The deadly games return", poster: "/sg3.jpg", year: 2026, status: "ongoing", rating: 8.2, genres: [{ id: "4", name: "Thriller", slug: "thriller" }], countries: [{ id: "5", name: "South Korea", code: "KR" }], languages: [{ id: "5", name: "Korean", code: "ko" }], seasons: [{ id: "s1", number: 1, title: "Season 3", episodes: [] }], createdAt: new Date(Date.now() - 259200000).toISOString(), updatedAt: new Date(Date.now() - 259200000).toISOString(), views: 670000 },
      ]);
      setTotalPages(2);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, filterStatus]);

  React.useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  const handleDelete = async () => {
    if (!deleteDialog.series) return;
    try {
      await series.deleteSeries(deleteDialog.series.id);
      addToast({ title: "Series deleted", description: `"${deleteDialog.series.title}" has been deleted.`, variant: "success" });
      setDeleteDialog({ open: false, series: null });
      fetchSeries();
    } catch {
      addToast({ title: "Error", description: "Failed to delete series.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Series</h1>
          <p className="text-gray-400 mt-1">Manage your TV series collection</p>
        </div>
        <Link href="/series/new">
          <Button>Add Series</Button>
        </Link>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search series..."
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
                { value: "ongoing", label: "Ongoing" },
                { value: "completed", label: "Completed" },
                { value: "upcoming", label: "Upcoming" },
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
                    <TableHead>Title</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Seasons</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seriesList.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-14 bg-gray-800 rounded flex items-center justify-center text-xs">
                            📺
                          </div>
                          <div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-xs text-gray-500">{item.genres?.[0]?.name || "N/A"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{item.year}</TableCell>
                      <TableCell>{item.seasons?.length || 0}</TableCell>
                      <TableCell>
                        <span className="text-amber-400">⭐ {item.rating}</span>
                      </TableCell>
                      <TableCell>{formatNumber(item.views || 0)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                      </TableCell>
                      <TableCell className="text-gray-400">{formatDate(item.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/series/${item.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300"
                            onClick={() => setDeleteDialog({ open: true, series: item })}
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
            <DialogTitle>Delete Series</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteDialog.series?.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, series: null })}>
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
