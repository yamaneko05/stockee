"use client";

import { cn } from "@/lib/utils";

type Category = {
  id: string;
  name: string;
  color: string | null;
};

type CategoryFilterProps = {
  categories: Category[];
  selectedCategoryId: string | null; // null = すべて, "uncategorized" = 未分類
  onSelect: (categoryId: string | null) => void;
};

export function CategoryFilter({
  categories,
  selectedCategoryId,
  onSelect,
}: CategoryFilterProps) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "shrink-0 rounded-full px-3 py-1 text-sm font-medium transition-colors",
          selectedCategoryId === null
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80",
        )}
      >
        すべて
      </button>
      <button
        onClick={() => onSelect("uncategorized")}
        className={cn(
          "shrink-0 rounded-full px-3 py-1 text-sm font-medium transition-colors",
          selectedCategoryId === "uncategorized"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80",
        )}
      >
        未分類
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelect(category.id)}
          className={cn(
            "shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors",
            selectedCategoryId === category.id
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
          )}
        >
          {category.color && (
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                selectedCategoryId === category.id && "opacity-80",
              )}
              style={{ backgroundColor: category.color }}
            />
          )}
          {category.name}
        </button>
      ))}
    </div>
  );
}
