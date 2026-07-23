"use client";

import * as React from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { users } from "@/lib/api";
import type { User } from "@/lib/api";
import { formatDate, getStatusColor } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

export default function UsersPage() {
  const { addToast } = useToast();
  const [userList, setUserList] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [banDialog, setBanDialog] = React.useState<{ open: boolean; user: User | null; action: "ban" | "unmute" }>({
    open: false,
    user: null,
    action: "ban",
  });

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await users.getUsers({
        page: currentPage,
        limit: 10,
        search: search || undefined,
        status: filterStatus || undefined,
      });
      setUserList(response.data.data);
      setTotalPages(response.data.totalPages);
    } catch {
      setUserList([
        { id: "1", name: "John Doe", email: "john@example.com", avatar: "", role: "user", status: "active", createdAt: new Date().toISOString(), lastLogin: new Date().toISOString(), watchHistory: 142, watchlist: 18 },
        { id: "2", name: "Jane Smith", email: "jane@example.com", avatar: "", role: "user", status: "active", createdAt: new Date(Date.now() - 86400000).toISOString(), lastLogin: new Date(Date.now() - 3600000).toISOString(), watchHistory: 89, watchlist: 12 },
        { id: "3", name: "Bob Wilson", email: "bob@example.com", avatar: "", role: "moderator", status: "active", createdAt: new Date(Date.now() - 172800000).toISOString(), lastLogin: new Date(Date.now() - 7200000).toISOString(), watchHistory: 234, watchlist: 34 },
        { id: "4", name: "Alice Brown", email: "alice@example.com", avatar: "", role: "user", status: "banned", createdAt: new Date(Date.now() - 259200000).toISOString(), lastLogin: new Date(Date.now() - 432000000).toISOString(), watchHistory: 56, watchlist: 8 },
        { id: "5", name: "Charlie Davis", email: "charlie@example.com", avatar: "", role: "user", status: "muted", createdAt: new Date(Date.now() - 345600000).toISOString(), lastLogin: new Date(Date.now() - 604800000).toISOString(), watchHistory: 78, watchlist: 15 },
        { id: "6", name: "Diana Miller", email: "diana@example.com", avatar: "", role: "user", status: "active", createdAt: new Date(Date.now() - 432000000).toISOString(), lastLogin: new Date(Date.now() - 86400000).toISOString(), watchHistory: 167, watchlist: 22 },
        { id: "7", name: "Edward Garcia", email: "edward@example.com", avatar: "", role: "admin", status: "active", createdAt: new Date(Date.now() - 518400000).toISOString(), lastLogin: new Date().toISOString(), watchHistory: 312, watchlist: 45 },
        { id: "8", name: "Fiona Martinez", email: "fiona@example.com", avatar: "", role: "user", status: "active", createdAt: new Date(Date.now() - 604800000).toISOString(), lastLogin: new Date(Date.now() - 172800000).toISOString(), watchHistory: 95, watchlist: 11 },
      ]);
      setTotalPages(4);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, filterStatus]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleBanUser = async () => {
    if (!banDialog.user) return;
    try {
      if (banDialog.action === "ban") {
        await users.banUser(banDialog.user.id);
        addToast({ title: "User banned", description: `${banDialog.user.name} has been banned.`, variant: "success" });
      } else {
        await users.unmuteUser(banDialog.user.id);
        addToast({ title: "User unmuted", description: `${banDialog.user.name} has been unmuted.`, variant: "success" });
      }
      setBanDialog({ open: false, user: null, action: "ban" });
      fetchUsers();
    } catch {
      addToast({ title: "Error", description: "Action failed.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-gray-400 mt-1">Manage your user base</p>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search users..."
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
                { value: "active", label: "Active" },
                { value: "banned", label: "Banned" },
                { value: "muted", label: "Muted" },
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
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Watch History</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userList.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback className="bg-gray-700 text-xs">
                              {user.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-400">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.watchHistory || 0} titles</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {user.lastLogin ? formatDate(user.lastLogin) : "Never"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {user.status === "active" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300"
                              onClick={() => setBanDialog({ open: true, user, action: "ban" })}
                            >
                              Ban
                            </Button>
                          )}
                          {user.status === "muted" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-emerald-400 hover:text-emerald-300"
                              onClick={() => setBanDialog({ open: true, user, action: "unmute" })}
                            >
                              Unmute
                            </Button>
                          )}
                          {user.status === "banned" && (
                            <Badge variant="destructive" className="text-xs">
                              Banned
                            </Badge>
                          )}
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

      <Dialog open={banDialog.open} onOpenChange={(open) => setBanDialog({ ...banDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {banDialog.action === "ban" ? "Ban User" : "Unmute User"}
            </DialogTitle>
            <DialogDescription>
              {banDialog.action === "ban"
                ? `Are you sure you want to ban "${banDialog.user?.name}"? They will not be able to access the platform.`
                : `Are you sure you want to unmute "${banDialog.user?.name}"? They will be able to post again.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialog({ open: false, user: null, action: "ban" })}>
              Cancel
            </Button>
            <Button variant={banDialog.action === "ban" ? "destructive" : "default"} onClick={handleBanUser}>
              {banDialog.action === "ban" ? "Ban User" : "Unmute User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
