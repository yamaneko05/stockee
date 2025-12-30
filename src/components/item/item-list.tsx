"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { SortableItemCard } from "@/components/item/sortable-item-card";
import { CategoryFilter } from "@/components/category/category-filter";
import { getItems, reorderItems } from "@/actions/item";
import { getCategories } from "@/actions/category";
import { useGroup } from "@/contexts/group-context";
import type { ItemModel } from "@/generated/prisma/models/Item";
import type { CategoryModel } from "@/generated/prisma/models/Category";

type ItemWithCategory = ItemModel & { category: CategoryModel | null };

type Category = {
  id: string;
  name: string;
  color: string | null;
};

export function ItemList() {
  const { selectedGroupId } = useGroup();
  const [items, setItems] = useState<ItemWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setSelectedCategoryId(null);
      try {
        const itemsData = await getItems(selectedGroupId);
        setItems(itemsData);

        // グループ選択時はグループのカテゴリ、未選択時は個人のカテゴリを取得
        const categoriesData = await getCategories(selectedGroupId);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Failed to load data:", error);
        setItems([]);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [selectedGroupId]);

  const refreshItems = async () => {
    const data = await getItems(selectedGroupId);
    setItems(data);
  };

  const filteredItems = useMemo(() => {
    if (selectedCategoryId === null) {
      return items;
    }
    if (selectedCategoryId === "uncategorized") {
      return items.filter((item) => !item.categoryId);
    }
    return items.filter((item) => item.categoryId === selectedCategoryId);
  }, [items, selectedCategoryId]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      const reorderInput = newItems.map((item, index) => ({
        id: item.id,
        sortOrder: index,
      }));

      try {
        await reorderItems(reorderInput, selectedGroupId);
      } catch (error) {
        console.error("Failed to reorder items:", error);
        await refreshItems();
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="border-b px-4 py-3">
        <h1 className="text-lg font-semibold">在庫一覧</h1>
      </div>

      <div className="p-4 space-y-4">
        {categories.length > 0 && (
          <CategoryFilter
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelect={setSelectedCategoryId}
          />
        )}

        {items.length === 0 ? (
          <p className="text-muted-foreground">品目がありません</p>
        ) : filteredItems.length === 0 ? (
          <p className="text-muted-foreground">該当する品目がありません</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredItems.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-3">
                {filteredItems.map((item) => (
                  <SortableItemCard
                    key={item.id}
                    item={item}
                    onUpdate={refreshItems}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
