"use client";

import * as React from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { users } from "@/lib/api";
import type { User } from "@/lib/api";
import { formatDate, formatNumber, getStatusColor } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

function getDisplayName(user: User) {
  if (user.firstName || user.lastName) {
    return [user.firstName, user.lastName].filter(Boolean).join(" ");
  }
  return user.username || "Unknown";
}

function getInitials(user: User) {
  if (user.firstName || user.lastName) {
    return [user.firstName?.[0], user.lastName?.[0]].filter(Boolean).join("").toUpperCase();
  }
  return user.username?.slice(0, 2).toUpperCase() || "??";
}

function getRoleName(user: User) {
  return typeof user.role === "object" ? user.role.name : user.role;
}

function getStatus(user: User): string {
  if (user.isBanned) return "banned";
  if (user.isMuted) return "muted";
  if (user.isActive) return "active";
  return "inactive";
}

function getStatusLabel(status: string) {
  switch (status) {
    case "active": return "Active";
    case "banned": return "Banned";
    case "muted": return "Muted";
    default: return "Inactive";
  }
}

export default function UsersPage() {
  const { addToast } = useToast();
  const [userList, setUserList] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const [banDialog, setBanDialog] = React.useState<{
    open: boolean;
    user: User | null;
    action: "ban" | "unmute";
  }>({ open: false, user: null, action: "ban" });

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  React.useEffect(() => {
    let cancelled = false;
    async function fetchUsers() {
      setLoading(true);
      try {
        const response = await users.getUsers({
          page: currentPage,
          limit: 20,
          query: debouncedSearch || undefined,
        });
        if (!cancelled) {
          const payload = response.data as any;
          setUserList(payload.data);
          setTotalPages(payload.totalPages);
          setTotalCount(payload.total);
        }
      } catch {
        if (!cancelled) {
          setUserList([]);
          setTotalPages(1);
          setTotalCount(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchUsers();
    return () => { cancelled = true; };
  }, [currentPage, debouncedSearch]);

  const handleAction = async () => {
    if (!banDialog.user) return;
    try {
      if (banDialog.action === "ban") {
        await users.banUser(banDialog.user.id);
        addToast({ title: "User banned", description: `${getDisplayName(banDialog.user)} has been banned.`, variant: "success" });
      } else {
        await users.unmuteUser(banDialog.user.id);
        addToast({ title: "User unmuted", description: `${getDisplayName(banDialog.user)} has been unmuted.`, variant: "success" });
      }
      setBanDialog({ open: false, user: null, action: "ban" });
      const response = await users.getUsers({ page: currentPage, limit: 20, query: debouncedSearch || undefined });
      const payload = response.data as any;
      setUserList(payload.data);
      setTotalPages(payload.totalPages);
      setTotalCount(payload.total);
    } catch {
      addToast({ title: "Error", description: "Action failed.", variant: "destructive" });
    }
  };

  const stats = React.useMemo(() => {
    const active = userList.filter((u) => u.isActive && !u.isBanned && !u.isMuted).length;
    const banned = userList.filter((u) => u.isBanned).length;
    const muted = userList.filter((u) => u.isMuted).length;
    return { active, banned, muted };
  }, [userList]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Foydalanuvchilar</h1>
        <p className="text-gray-500 mt-1">Foydalanuvchilarni boshqarish</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-sm text-gray-500">Jami</p>
          <p className="text-2xl font-bold mt-1">{formatNumber(totalCount)}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-sm text-gray-500">Faol</p>
          <p className="text-2xl font-bold mt-1 text-emerald-400">{formatNumber(stats.active)}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-sm text-gray-500">Bloklangan</p>
          <p className="text-2xl font-bold mt-1 text-red-400">{formatNumber(stats.banned)}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-sm text-gray-500">Ovozi o'chirilgan</p>
          <p className="text-2xl font-bold mt-1 text-orange-400">{formatNumber(stats.muted)}</p>
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
                placeholder="Foydalanuvchi qidirish..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 max-w-sm"
              />
            </div>
            {!loading && (
              <span className="text-sm text-gray-500">{totalCount} ta foydalanuvchi</span>
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
          ) : userList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-600">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <p className="text-gray-500 text-sm">Hech narsa topilmadi</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Foydalanuvchi</TableHead>
                    <TableHead>Telegram ID</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>XP / Level</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>Qo'shilgan</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userList.map((user) => {
                    const status = getStatus(user);
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar || undefined} alt={getDisplayName(user)} />
                              <AvatarFallback className="bg-gray-700 text-xs">
                                {getInitials(user)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{getDisplayName(user)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-400 font-mono text-sm">{user.telegramId || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleName(user) === "admin" ? "default" : "secondary"}>
                            {getRoleName(user)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {user.xp ?? 0} XP / Lv.{user.level ?? 1}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(status)}>{getStatusLabel(status)}</Badge>
                        </TableCell>
                        <TableCell className="text-gray-400">{formatDate(user.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {!user.isBanned && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-300"
                                onClick={() => setBanDialog({ open: true, user, action: "ban" })}
                              >
                                Ban
                              </Button>
                            )}
                            {user.isBanned && (
                              <Badge variant="destructive" className="text-xs">Banned</Badge>
                            )}
                            {user.isMuted && !user.isBanned && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-emerald-400 hover:text-emerald-300"
                                onClick={() => setBanDialog({ open: true, user, action: "unmute" })}
                              >
                                Unmute
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between p-4 border-t border-white/[0.04]">
                <p className="text-sm text-gray-500">
                  {currentPage} / {totalPages} sahifa
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Oldingi
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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

      <Dialog open={banDialog.open} onOpenChange={(open) => setBanDialog({ ...banDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {banDialog.action === "ban" ? "Foydalanuvchini bloklash" : "Ovozni yoqish"}
            </DialogTitle>
            <DialogDescription>
              {banDialog.action === "ban"
                ? `"${banDialog.user ? getDisplayName(banDialog.user) : ""}" ni bloklashni xohlaysizmi? Unga kirish taqiqlanadi.`
                : `"${banDialog.user ? getDisplayName(banDialog.user) : ""}" ning ovozini yoqishni xohlaysizmi? U yana yozishi mumkin.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialog({ open: false, user: null, action: "ban" })}>
              Bekor qilish
            </Button>
            <Button variant={banDialog.action === "ban" ? "destructive" : "default"} onClick={handleAction}>
              {banDialog.action === "ban" ? "Bloklash" : "Ovozni yoqish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
