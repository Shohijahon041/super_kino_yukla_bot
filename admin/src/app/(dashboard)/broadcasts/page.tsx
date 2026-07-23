"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { admin } from "@/lib/api";
import type { Broadcast } from "@/lib/api";
import { formatDate, getStatusColor } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

export default function BroadcastsPage() {
  const { addToast } = useToast();
  const [broadcastList, setBroadcastList] = React.useState<Broadcast[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const [createDialog, setCreateDialog] = React.useState(false);
  const [form, setForm] = React.useState({
    title: "",
    message: "",
    type: "info" as "info" | "warning" | "urgent",
    targetAudience: "all",
    scheduledAt: "",
  });
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    async function fetchBroadcasts() {
      setLoading(true);
      setError(null);
      try {
        const response = await admin.getBroadcasts({ page: currentPage, limit: 10 });
        if (!cancelled) {
          const payload = response.data as any;
          setBroadcastList(payload.data);
          setTotalPages(payload.totalPages);
          setTotalCount(payload.total);
        }
      } catch {
        if (!cancelled) {
          setError("Broadcastlarni yuklashda xatolik yuz berdi. Keyinroq qayta urinib ko'ring.");
          setBroadcastList([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    fetchBroadcasts();
    return () => { cancelled = true; };
  }, [currentPage]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await admin.broadcast(form);
      addToast({ title: "Broadcast created", description: "Your broadcast has been created.", variant: "success" });
      setCreateDialog(false);
      setForm({ title: "", message: "", type: "info", targetAudience: "all", scheduledAt: "" });
      setCurrentPage(1);
    } catch {
      addToast({ title: "Error", description: "Failed to create broadcast.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Broadcasts</h1>
          <p className="text-gray-500 mt-1">Send notifications to your users</p>
        </div>
        <Button variant="brand" onClick={() => setCreateDialog(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="mr-1.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Broadcast
        </Button>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden card-glow">
        <div className="p-4 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <h2 className="text-sm font-medium text-gray-400">Broadcast History</h2>
            </div>
            {!loading && !error && (
              <span className="text-sm text-gray-500">{totalCount} broadcasts</span>
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
          ) : broadcastList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-600">
                <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0" />
              </svg>
              <p className="text-sm text-gray-500">Hech narsa topilmadi</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/[0.04] hover:bg-transparent">
                    <TableHead>Title</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {broadcastList.map((broadcast) => (
                    <TableRow key={broadcast.id}>
                      <TableCell className="font-medium text-white">{broadcast.title}</TableCell>
                      <TableCell className="max-w-xs truncate text-gray-400">
                        {broadcast.message}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            broadcast.type === "urgent"
                              ? "bg-red-500/20 text-red-400 border-red-500/30"
                              : broadcast.type === "warning"
                              ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                              : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                          }
                        >
                          {broadcast.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-400">{broadcast.targetAudience}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(broadcast.status)}>{broadcast.status}</Badge>
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {broadcast.sentCount?.toLocaleString() || "-"}
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {formatDate(broadcast.sentAt || broadcast.scheduledAt || broadcast.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between p-4 border-t border-white/[0.04]">
                <p className="text-sm text-gray-500">
                  Page {currentPage} / {totalPages}
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
        </div>
      </div>

      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Broadcast</DialogTitle>
            <DialogDescription>Create a new broadcast notification for users.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Title *</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Broadcast title"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Message *</label>
              <Textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Broadcast message"
                rows={4}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Type</label>
                <Select
                  options={[
                    { value: "info", label: "Info" },
                    { value: "warning", label: "Warning" },
                    { value: "urgent", label: "Urgent" },
                  ]}
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as "info" | "warning" | "urgent" })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Target Audience</label>
                <Select
                  options={[
                    { value: "all", label: "All Users" },
                    { value: "premium", label: "Premium Users" },
                    { value: "free", label: "Free Users" },
                    { value: "new", label: "New Users" },
                  ]}
                  value={form.targetAudience}
                  onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Schedule (optional)</label>
              <Input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : form.scheduledAt ? "Schedule" : "Send Now"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
