"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { joinGroup } from "@/actions/group";
import { useGroup } from "@/contexts/group-context";

type GroupInfo = {
  id: string;
  name: string;
  ownerName: string;
  memberCount: number;
};

export function JoinGroupForm({ group, inviteCode }: { group: GroupInfo; inviteCode: string }) {
  const router = useRouter();
  const { setSelectedGroupId } = useGroup();
  const [error, setError] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    setError("");
    setIsJoining(true);
    try {
      const joinedGroup = await joinGroup(inviteCode);
      setSelectedGroupId(joinedGroup.id);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsJoining(false);
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
        <h1 className="text-lg font-semibold">グループに参加</h1>
      </div>

      <div className="p-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>{group.name}</CardTitle>
            <CardDescription>
              {group.ownerName}さんのグループ
              <br />
              現在{group.memberCount}人のメンバー
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <Button className="w-full" onClick={handleJoin} disabled={isJoining}>
              {isJoining ? "参加中..." : "グループに参加する"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
