"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Minus, Plus, MoreVertical, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { incrementStock, decrementStock, deleteItem } from "@/actions/item";
import type { ItemModel } from "@/generated/prisma/models/Item";

type ItemCardProps = {
  item: ItemModel;
  onUpdate?: () => void;
  noBorderRadius?: "left" | "right";
};

export function ItemCard({ item, onUpdate, noBorderRadius }: ItemCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [quantity, setQuantity] = useState(item.quantity);

  const handleIncrement = () => {
    setQuantity((prev) => prev + 1);
    startTransition(async () => {
      await incrementStock(item.id);
      onUpdate?.();
    });
  };

  const handleDecrement = () => {
    if (quantity <= 0) return;
    setQuantity((prev) => prev - 1);
    startTransition(async () => {
      await decrementStock(item.id);
      onUpdate?.();
    });
  };

  const handleDelete = () => {
    if (!confirm("この品目を削除しますか？")) return;
    setIsDeleting(true);
    startTransition(async () => {
      await deleteItem(item.id);
      onUpdate?.();
    });
  };

  const borderRadiusClass =
    noBorderRadius === "left"
      ? "rounded-r-lg rounded-l-none"
      : noBorderRadius === "right"
        ? "rounded-l-lg rounded-r-none"
        : "rounded-lg";

  return (
    <div
      className={`border bg-card p-3 ${borderRadiusClass} ${
        isDeleting ? "opacity-50" : ""
      }`}
    >
      <div className="font-medium">{item.name}</div>
      <div className="mt-1 flex items-center justify-between">
        <div className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
          {item.productName || "\u00A0"}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={handleDecrement}
            disabled={isPending || quantity <= 0}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <div className="flex min-w-15 items-center justify-center gap-1 text-sm">
            {quantity === 0 && (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            )}
            <span className={quantity === 0 ? "text-amber-500" : ""}>
              {quantity}
              {item.unit}
            </span>
          </div>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={handleIncrement}
            disabled={isPending}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/items/${item.id}/edit`}>編集</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive"
              >
                削除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
