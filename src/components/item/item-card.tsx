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
import type { CategoryModel } from "@/generated/prisma/models/Category";

type ItemWithCategory = ItemModel & { category?: CategoryModel | null };

type ItemCardProps = {
  item: ItemWithCategory;
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

  // 閾値警告の判定（閾値未満で警告）
  const showWarning =
    item.threshold !== null && quantity < item.threshold;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ja-JP").format(price);
  };

  return (
    <div
      className={`relative border bg-card p-3 ${borderRadiusClass} ${
        isDeleting ? "opacity-50" : ""
      } ${showWarning ? "border-amber-500/50 bg-amber-50 dark:bg-amber-950/20" : ""}`}
    >
      {/* 警告時の左端カラーバー */}
      {showWarning && (
        <div
          className={`absolute left-0 top-0 h-full w-1 bg-amber-500 ${
            noBorderRadius === "left" ? "" : "rounded-l-lg"
          }`}
        />
      )}
      {/* 1行目: 品目名 + 数量操作 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 font-medium">
          {showWarning && <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />}
          <span className="truncate">{item.name}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={handleDecrement}
            disabled={isPending || quantity <= 0}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <div className="flex min-w-15 items-center justify-center gap-1 text-sm">
            <span className={showWarning ? "text-amber-600 dark:text-amber-500" : ""}>
              {quantity}
              {item.threshold != null && (
                <span className="text-muted-foreground">/{item.threshold}</span>
              )}
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

      {/* 2行目: カテゴリ + 商品名 + 価格 */}
      <div className="mt-2 flex items-center justify-between gap-2 text-sm">
        <div className="shrink-0">
          {item.category && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
              style={{
                backgroundColor: item.category.color ? `${item.category.color}20` : undefined,
                color: item.category.color || undefined,
              }}
            >
              {item.category.color && (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.category.color }}
                />
              )}
              {item.category.name}
            </span>
          )}
        </div>
        <div className="flex min-w-0 items-center justify-end gap-2">
          <span className="truncate text-muted-foreground">
            {item.productName}
          </span>
          {item.price != null && (
            <span className="shrink-0 text-muted-foreground">¥{formatPrice(item.price)}</span>
          )}
        </div>
      </div>

      {/* 3行目: 備考（ある場合のみ） */}
      {item.note && (
        <div className="mt-1.5 flex items-start gap-1 text-xs text-muted-foreground">
          <span className="line-clamp-1">{item.note}</span>
        </div>
      )}
    </div>
  );
}
