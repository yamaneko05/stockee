"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus, User, Users, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGroup } from "@/contexts/group-context";
import { getGroups } from "@/actions/group";

type GroupInfo = {
  id: string;
  name: string;
  isOwner: boolean;
};

export function GroupSwitcher() {
  const router = useRouter();
  const { selectedGroupId, setSelectedGroupId } = useGroup();
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadGroups() {
      try {
        const data = await getGroups();
        const allGroups: GroupInfo[] = [
          ...data.owned.map((g) => ({ id: g.id, name: g.name, isOwner: true })),
          ...data.joined.map((g) => ({ id: g.id, name: g.name, isOwner: false })),
        ];
        setGroups(allGroups);

        if (selectedGroupId && !allGroups.find((g) => g.id === selectedGroupId)) {
          setSelectedGroupId(null);
        }
      } catch {
        console.error("Failed to load groups");
      } finally {
        setIsLoading(false);
      }
    }
    loadGroups();
  }, [selectedGroupId, setSelectedGroupId]);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);
  const displayName = selectedGroup ? selectedGroup.name : "個人";

  const handleSelect = (groupId: string | null) => {
    setSelectedGroupId(groupId);
    router.refresh();
  };

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled className="gap-1">
        <span className="max-w-24 truncate">読込中...</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          {selectedGroup ? (
            <Users className="h-4 w-4" />
          ) : (
            <User className="h-4 w-4" />
          )}
          <span className="max-w-24 truncate">{displayName}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem onClick={() => handleSelect(null)}>
          <User className="mr-2 h-4 w-4" />
          <span>個人</span>
          {!selectedGroupId && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>

        {groups.length > 0 && <DropdownMenuSeparator />}

        {groups.map((group) => (
          <DropdownMenuItem key={group.id} onClick={() => handleSelect(group.id)}>
            <Users className="mr-2 h-4 w-4" />
            <span className="truncate">{group.name}</span>
            {selectedGroupId === group.id && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => router.push("/groups/new")}>
          <Plus className="mr-2 h-4 w-4" />
          <span>グループ作成</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
