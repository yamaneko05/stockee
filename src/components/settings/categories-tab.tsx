"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Tags, User, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CategoryList } from "@/components/category/category-list";
import { getCategories } from "@/actions/category";
import { cn } from "@/lib/utils";

type Category = {
  id: string;
  name: string;
  color: string | null;
  sortOrder: number;
  itemCount: number;
};

type Group = {
  id: string;
  name: string;
  inviteCode: string | null;
  isOwner: boolean;
  memberCount: number;
  ownerName?: string;
};

type CategoriesTabProps = {
  groups: {
    owned: Group[];
    joined: Group[];
  };
};

export function CategoriesTab({ groups }: CategoriesTabProps) {
  const router = useRouter();
  const [personalCategories, setPersonalCategories] = useState<Category[]>([]);
  const [groupCategories, setGroupCategories] = useState<Record<string, Category[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    personal: true,
  });

  const allGroups = [...groups.owned, ...groups.joined];

  const loadCategories = async () => {
    try {
      // 個人カテゴリを取得
      const personal = await getCategories(null);
      setPersonalCategories(personal);

      // 各グループのカテゴリを取得
      const groupCats: Record<string, Category[]> = {};
      for (const group of allGroups) {
        const cats = await getCategories(group.id);
        groupCats[group.id] = cats;
      }
      setGroupCategories(groupCats);
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdate = () => {
    loadCategories();
    router.refresh();
  };

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-sm text-muted-foreground">読み込み中...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* 個人カテゴリ */}
      <Collapsible open={openSections.personal} onOpenChange={() => toggleSection("personal")}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4" />
                  個人
                </CardTitle>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    openSections.personal && "rotate-180"
                  )}
                />
              </div>
              <CardDescription>
                グループに属さない品目のカテゴリ
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <CategoryList
                categories={personalCategories}
                onUpdate={handleUpdate}
              />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* グループカテゴリ */}
      {allGroups.map((group) => (
        <Collapsible
          key={group.id}
          open={openSections[group.id]}
          onOpenChange={() => toggleSection(group.id)}
        >
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4" />
                    {group.name}
                  </CardTitle>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      openSections[group.id] && "rotate-180"
                    )}
                  />
                </div>
                <CardDescription>
                  {group.isOwner ? "あなたがオーナー" : `${group.ownerName}さんのグループ`}
                  {" · "}
                  {group.memberCount}人
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <CategoryList
                  groupId={group.id}
                  categories={groupCategories[group.id] || []}
                  onUpdate={handleUpdate}
                />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ))}

      {allGroups.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-sm text-muted-foreground">
              グループに参加すると、グループのカテゴリもここで管理できます
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
