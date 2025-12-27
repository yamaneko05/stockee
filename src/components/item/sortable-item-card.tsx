"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { ItemCard } from "@/components/item/item-card";
import type { ItemModel } from "@/generated/prisma/models/Item";

type SortableItemCardProps = {
  item: ItemModel;
  onUpdate?: () => void;
};

export function SortableItemCard({ item, onUpdate }: SortableItemCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-stretch gap-0 ${isDragging ? "opacity-50" : ""}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="flex cursor-grab items-center rounded-l-lg border border-r-0 bg-muted/50 px-1 active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <ItemCard item={item} onUpdate={onUpdate} noBorderRadius="left" />
      </div>
    </div>
  );
}
