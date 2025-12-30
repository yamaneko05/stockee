"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  LogOut,
  Users,
  Plus,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteGroup, leaveGroup, regenerateInviteCode, getGroup, removeMember } from "@/actions/group";
import { useGroup } from "@/contexts/group-context";

type Group = {
  id: string;
  name: string;
  inviteCode: string | null;
  isOwner: boolean;
  memberCount: number;
  ownerName?: string;
};

type GroupsTabProps = {
  groups: {
    owned: Group[];
    joined: Group[];
  };
};

type GroupDetail = {
  id: string;
  name: string;
  inviteCode: string | null;
  isOwner: boolean;
  owner: { id: string; name: string; email: string };
  members: {
    id: string;
    user: { id: string; name: string; email: string };
    createdAt: Date;
  }[];
};

export function GroupsTab({ groups }: GroupsTabProps) {
  const router = useRouter();
  const { setSelectedGroupId } = useGroup();
  const [selectedGroup, setSelectedGroup] = useState<GroupDetail | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const allGroups = [...groups.owned, ...groups.joined];

  const handleOpenGroup = async (groupId: string) => {
    setIsLoading(true);
    try {
      const detail = await getGroup(groupId);
      if (detail) {
        setSelectedGroup(detail);
        setInviteCode(detail.inviteCode);
        setIsDialogOpen(true);
      }
    } catch (error) {
      console.error("Failed to load group:", error);
      toast.error("グループの読み込みに失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const inviteUrl = inviteCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/join/${inviteCode}`
    : null;

  const handleCopyLink = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success("招待リンクをコピーしました");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateCode = async () => {
    if (!selectedGroup) return;
    if (!confirm("招待リンクを再生成すると、以前のリンクは無効になります。よろしいですか？")) {
      return;
    }
    setIsRegenerating(true);
    try {
      const newCode = await regenerateInviteCode(selectedGroup.id);
      setInviteCode(newCode);
      toast.success("招待リンクを再生成しました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;
    if (!confirm(`グループ「${selectedGroup.name}」を削除しますか？この操作は取り消せません。`)) {
      return;
    }
    try {
      await deleteGroup(selectedGroup.id);
      setSelectedGroupId(null);
      toast.success("グループを削除しました");
      setIsDialogOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "エラーが発生しました");
    }
  };

  const handleLeaveGroup = async () => {
    if (!selectedGroup) return;
    if (!confirm(`グループ「${selectedGroup.name}」から脱退しますか？`)) {
      return;
    }
    try {
      await leaveGroup(selectedGroup.id);
      setSelectedGroupId(null);
      toast.success("グループから脱退しました");
      setIsDialogOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "エラーが発生しました");
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!selectedGroup) return;
    if (!confirm(`${memberName}さんをグループから削除しますか？`)) {
      return;
    }
    try {
      await removeMember(selectedGroup.id, memberId);
      toast.success("メンバーを削除しました");
      // リロードしてメンバー一覧を更新
      const detail = await getGroup(selectedGroup.id);
      if (detail) {
        setSelectedGroup(detail);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "エラーが発生しました");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">グループ一覧</CardTitle>
          <CardDescription>
            所属しているグループを管理できます
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {allGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              まだグループに参加していません
            </p>
          ) : (
            <div className="divide-y">
              {allGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => handleOpenGroup(group.id)}
                  disabled={isLoading}
                  className="flex w-full items-center justify-between py-3 text-left hover:bg-muted/50 px-2 -mx-2 rounded-md transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{group.name}</p>
                        {group.isOwner && (
                          <Crown className="h-3.5 w-3.5 text-amber-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {group.isOwner
                          ? `オーナー · ${group.memberCount}人`
                          : `${group.ownerName}さんのグループ · ${group.memberCount}人`}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}

          <Button asChild className="w-full mt-4">
            <Link href="/groups/new">
              <Plus className="mr-2 h-4 w-4" />
              新しいグループを作成
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* グループ詳細ダイアログ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          {selectedGroup && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedGroup.name}
                  {selectedGroup.isOwner && (
                    <Crown className="h-4 w-4 text-amber-500" />
                  )}
                </DialogTitle>
                <DialogDescription>
                  {selectedGroup.isOwner ? "あなたがオーナーです" : `${selectedGroup.owner.name}さんのグループ`}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* 招待リンク（オーナーのみ） */}
                {selectedGroup.isOwner && inviteUrl && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">招待リンク</p>
                    <div className="flex gap-2">
                      <code className="flex-1 rounded bg-muted px-3 py-2 text-xs break-all">
                        {inviteUrl}
                      </code>
                      <Button variant="outline" size="icon" onClick={handleCopyLink}>
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerateCode}
                      disabled={isRegenerating}
                    >
                      <RefreshCw className={`mr-2 h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} />
                      リンクを再生成
                    </Button>
                  </div>
                )}

                {/* メンバー一覧 */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    メンバー ({selectedGroup.members.length + 1}人)
                  </p>
                  <div className="divide-y rounded-md border">
                    {/* オーナー */}
                    <div className="flex items-center justify-between p-3">
                      <div>
                        <p className="font-medium text-sm">{selectedGroup.owner.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedGroup.owner.email}</p>
                      </div>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        オーナー
                      </span>
                    </div>
                    {/* メンバー */}
                    {selectedGroup.members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3">
                        <div>
                          <p className="font-medium text-sm">{member.user.name}</p>
                          <p className="text-xs text-muted-foreground">{member.user.email}</p>
                        </div>
                        {selectedGroup.isOwner && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id, member.user.name)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter className="flex-col gap-2 sm:flex-col">
                {selectedGroup.isOwner ? (
                  <Button variant="destructive" onClick={handleDeleteGroup} className="w-full">
                    <Trash2 className="mr-2 h-4 w-4" />
                    グループを削除
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={handleLeaveGroup} className="w-full">
                    <LogOut className="mr-2 h-4 w-4" />
                    グループから脱退
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
