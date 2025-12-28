"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tags } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryList } from "@/components/category/category-list";
import { getCategories } from "@/actions/category";

type Category = {
  id: string;
  name: string;
  color: string | null;
  sortOrder: number;
  itemCount: number;
};

export function PersonalCategories() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCategories = async () => {
    try {
      const data = await getCategories(null);
      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleUpdate = () => {
    loadCategories();
    router.refresh();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tags className="h-4 w-4" />
            個人カテゴリ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tags className="h-4 w-4" />
          個人カテゴリ
        </CardTitle>
        <CardDescription>
          グループに属さない品目を分類するカテゴリを管理できます
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CategoryList
          categories={categories}
          onUpdate={handleUpdate}
        />
      </CardContent>
    </Card>
  );
}
