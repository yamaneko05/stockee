"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy, Check, RefreshCw, Trash2, LogOut, Users, Tags } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteGroup, leaveGroup, regenerateInviteCode, removeMember } from "@/actions/group";
import { useGroup } from "@/contexts/group-context";
import { CategoryList } from "@/components/category/category-list";

type Category = {
  id: string;
  name: string;
  color: string | null;
  sortOrder: number;
  itemCount: number;
};

type GroupData = {
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
  categories: Category[];
};

export function GroupSettings({ group }: { group: GroupData }) {
  const router = useRouter();
  const { setSelectedGroupId } = useGroup();
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [inviteCode, setInviteCode] = useState(group.inviteCode);

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
    if (!confirm("招待リンクを再生成すると、以前のリンクは無効になります。よろしいですか？")) {
      return;
    }
    setIsRegenerating(true);
    try {
      const newCode = await regenerateInviteCode(group.id);
      setInviteCode(newCode);
      toast.success("招待リンクを再生成しました");
    } catch (err) {
      alert(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm(`グループ「${group.name}」を削除しますか？この操作は取り消せません。`)) {
      return;
    }
    try {
      await deleteGroup(group.id);
      setSelectedGroupId(null);
      toast.success("グループを削除しました");
      router.push("/");
    } catch (err) {
      alert(err instanceof Error ? err.message : "エラーが発生しました");
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm(`グループ「${group.name}」から脱退しますか？`)) {
      return;
    }
    try {
      await leaveGroup(group.id);
      setSelectedGroupId(null);
      toast.success("グループから脱退しました");
      router.push("/");
    } catch (err) {
      alert(err instanceof Error ? err.message : "エラーが発生しました");
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`${memberName}さんをグループから削除しますか？`)) {
      return;
    }
    try {
      await removeMember(group.id, memberId);
      toast.success("メンバーを削除しました");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "エラーが発生しました");
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">戻る</span>
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">{group.name}</h1>
      </div>

      <div className="p-4 space-y-4">
        {group.isOwner && inviteUrl && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">招待リンク</CardTitle>
              <CardDescription>
                このリンクを共有して、メンバーを招待できます
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <code className="flex-1 rounded bg-muted px-3 py-2 text-sm break-all">
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
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              メンバー ({group.members.length + 1}人)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              <li className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">{group.owner.name}</p>
                  <p className="text-sm text-muted-foreground">{group.owner.email}</p>
                </div>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  オーナー
                </span>
              </li>
              {group.members.map((member) => (
                <li key={member.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">{member.user.name}</p>
                    <p className="text-sm text-muted-foreground">{member.user.email}</p>
                  </div>
                  {group.isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id, member.user.name)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Tags className="h-4 w-4" />
              カテゴリ
            </CardTitle>
            <CardDescription>
              品目を分類するカテゴリを管理できます
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryList
              groupId={group.id}
              categories={group.categories}
              onUpdate={() => router.refresh()}
            />
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-base text-destructive">危険な操作</CardTitle>
          </CardHeader>
          <CardContent>
            {group.isOwner ? (
              <Button variant="destructive" onClick={handleDeleteGroup}>
                <Trash2 className="mr-2 h-4 w-4" />
                グループを削除
              </Button>
            ) : (
              <Button variant="destructive" onClick={handleLeaveGroup}>
                <LogOut className="mr-2 h-4 w-4" />
                グループから脱退
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
