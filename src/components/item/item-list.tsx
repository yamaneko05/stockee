"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Settings } from "lucide-react";
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
import { getItems, reorderItems } from "@/actions/item";
import { useGroup } from "@/contexts/group-context";
import type { ItemModel } from "@/generated/prisma/models/Item";

export function ItemList() {
  const { selectedGroupId } = useGroup();
  const [items, setItems] = useState<ItemModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    async function loadItems() {
      setIsLoading(true);
      try {
        const data = await getItems(selectedGroupId);
        setItems(data);
      } catch (error) {
        console.error("Failed to load items:", error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadItems();
  }, [selectedGroupId]);

  const refreshItems = async () => {
    const data = await getItems(selectedGroupId);
    setItems(data);
  };

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
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h1 className="text-lg font-semibold">在庫一覧</h1>
        <div className="flex items-center gap-1">
          {selectedGroupId && (
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/groups/${selectedGroupId}`}>
                <Settings className="h-5 w-5" />
                <span className="sr-only">グループ設定</span>
              </Link>
            </Button>
          )}
          <Button variant="ghost" size="icon" asChild>
            <Link href="/items/new">
              <Plus className="h-5 w-5" />
              <span className="sr-only">品目を追加</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="p-4">
        {items.length === 0 ? (
          <p className="text-muted-foreground">品目がありません</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-3">
                {items.map((item) => (
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
