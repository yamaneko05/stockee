"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Tags, Users } from "lucide-react";
import { AccountSettings } from "./account-settings";
import { CategoriesTab } from "./categories-tab";
import { GroupsTab } from "./groups-tab";
import { LogoutButton } from "@/components/auth/logout-button";

type Group = {
  id: string;
  name: string;
  inviteCode: string | null;
  isOwner: boolean;
  memberCount: number;
  ownerName?: string;
};

type SettingsTabsProps = {
  user: {
    id: string;
    name: string;
    email: string;
  };
  groups: {
    owned: Group[];
    joined: Group[];
  };
};

const validTabs = ["account", "categories", "groups"] as const;
type TabValue = (typeof validTabs)[number];

export function SettingsTabs({ user, groups }: SettingsTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const defaultTab: TabValue = validTabs.includes(tabParam as TabValue)
    ? (tabParam as TabValue)
    : "account";

  const handleTabChange = (value: string) => {
    router.replace(`/settings?tab=${value}`, { scroll: false });
  };

  return (
    <Tabs value={defaultTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="account" className="flex items-center gap-1.5">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">アカウント</span>
        </TabsTrigger>
        <TabsTrigger value="categories" className="flex items-center gap-1.5">
          <Tags className="h-4 w-4" />
          <span className="hidden sm:inline">カテゴリ</span>
        </TabsTrigger>
        <TabsTrigger value="groups" className="flex items-center gap-1.5">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">グループ</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="account" className="mt-4 space-y-4">
        <AccountSettings user={user} />
        <LogoutButton />
      </TabsContent>

      <TabsContent value="categories" className="mt-4">
        <CategoriesTab groups={groups} />
      </TabsContent>

      <TabsContent value="groups" className="mt-4">
        <GroupsTab groups={groups} />
      </TabsContent>
    </Tabs>
  );
}
