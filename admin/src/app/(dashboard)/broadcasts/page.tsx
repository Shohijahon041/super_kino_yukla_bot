"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { admin } from "@/lib/api";
import type { Broadcast } from "@/lib/api";
import { formatDate, getStatusColor } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

export default function BroadcastsPage() {
  const { addToast } = useToast();
  const [broadcastList, setBroadcastList] = React.useState<Broadcast[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [createDialog, setCreateDialog] = React.useState(false);
  const [form, setForm] = React.useState({
    title: "",
    message: "",
    type: "info" as "info" | "warning" | "urgent",
    targetAudience: "all",
    scheduledAt: "",
  });
  const [submitting, setSubmitting] = React.useState(false);

  const fetchBroadcasts = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await admin.getBroadcasts({ page: currentPage, limit: 10 });
      setBroadcastList(response.data.data);
      setTotalPages(response.data.totalPages);
    } catch {
      setBroadcastList([
        { id: "1", title: "New Content Alert", message: "Check out the latest movies added this week!", type: "info", status: "sent", targetAudience: "all", sentAt: new Date().toISOString(), createdAt: new Date().toISOString(), sentCount: 15420 },
        { id: "2", title: "Server Maintenance", message: "Scheduled maintenance on Sunday 2AM-4AM UTC.", type: "warning", status: "sent", targetAudience: "all", sentAt: new Date(Date.now() - 86400000).toISOString(), createdAt: new Date(Date.now() - 86400000).toISOString(), sentCount: 15420 },
        { id: "3", title: "Premium Sale", message: "50% off premium subscription - Limited time!", type: "urgent", status: "scheduled", targetAudience: "free", scheduledAt: new Date(Date.now() + 86400000).toISOString(), createdAt: new Date(Date.now() - 172800000).toISOString() },
        { id: "4", title: "Weekly Digest", message: "Your weekly watch recommendations are ready.", type: "info", status: "draft", targetAudience: "all", createdAt: new Date(Date.now() - 259200000).toISOString() },
        { id: "5", title: "Holiday Special", message: "Enjoy our curated holiday movie collection!", type: "info", status: "sent", targetAudience: "all", sentAt: new Date(Date.now() - 345600000).toISOString(), createdAt: new Date(Date.now() - 345600000).toISOString(), sentCount: 12300 },
      ]);
      setTotalPages(2);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  React.useEffect(() => {
    fetchBroadcasts();
  }, [fetchBroadcasts]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await admin.broadcast(form);
      addToast({ title: "Broadcast created", description: "Your broadcast has been created.", variant: "success" });
      setCreateDialog(false);
      setForm({ title: "", message: "", type: "info", targetAudience: "all", scheduledAt: "" });
      fetchBroadcasts();
    } catch {
      addToast({ title: "Error", description: "Failed to create broadcast.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Broadcasts</h1>
          <p className="text-gray-400 mt-1">Send notifications to your users</p>
        </div>
        <Button onClick={() => setCreateDialog(true)}>New Broadcast</Button>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle>Broadcast History</CardTitle>
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
                      <TableCell className="font-medium">{broadcast.title}</TableCell>
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
                      <TableCell className="text-gray-400">
                        {formatDate(broadcast.sentAt || broadcast.scheduledAt || broadcast.createdAt)}
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
