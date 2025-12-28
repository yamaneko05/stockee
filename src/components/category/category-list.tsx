"use client";

import { useState, useTransition } from "react";
import { Plus, GripVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createCategory, updateCategory, deleteCategory, reorderCategories } from "@/actions/category";
import { CATEGORY_COLORS } from "@/lib/validations/category";

type Category = {
  id: string;
  name: string;
  color: string | null;
  sortOrder: number;
  itemCount: number;
};

type CategoryListProps = {
  groupId: string;
  categories: Category[];
  onUpdate: () => void;
};

export function CategoryList({ groupId, categories, onUpdate }: CategoryListProps) {
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setColor(null);
    setEditingCategory(null);
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setName(category.name);
      setColor(category.color);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    startTransition(async () => {
      try {
        if (editingCategory) {
          await updateCategory(editingCategory.id, { name: name.trim(), color });
        } else {
          await createCategory(groupId, { name: name.trim(), color });
        }
        handleCloseDialog();
        onUpdate();
      } catch (err) {
        alert(err instanceof Error ? err.message : "エラーが発生しました");
      }
    });
  };

  const handleDelete = (category: Category) => {
    if (category.itemCount > 0) {
      if (!confirm(`「${category.name}」には${category.itemCount}件の品目が登録されています。削除すると、これらの品目は未分類になります。削除しますか？`)) {
        return;
      }
    } else if (!confirm(`「${category.name}」を削除しますか？`)) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteCategory(category.id);
        onUpdate();
      } catch (err) {
        alert(err instanceof Error ? err.message : "エラーが発生しました");
      }
    });
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = categories.findIndex((c) => c.id === draggedId);
    const targetIndex = categories.findIndex((c) => c.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newCategories = [...categories];
    const [removed] = newCategories.splice(draggedIndex, 1);
    newCategories.splice(targetIndex, 0, removed);

    const reorderedItems = newCategories.map((c, index) => ({
      id: c.id,
      sortOrder: index,
    }));

    startTransition(async () => {
      try {
        await reorderCategories(groupId, reorderedItems);
        onUpdate();
      } catch (err) {
        alert(err instanceof Error ? err.message : "エラーが発生しました");
      }
    });

    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          ドラッグで並び替えできます
        </p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => handleOpenDialog()}>
              <Plus className="mr-1 h-4 w-4" />
              追加
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "カテゴリを編集" : "カテゴリを追加"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="category-name" className="text-sm font-medium">
                  カテゴリ名
                </label>
                <Input
                  id="category-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例: 食品、日用品"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">色（任意）</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setColor(null)}
                    className={`h-8 w-8 rounded-full border-2 bg-muted ${
                      color === null ? "border-primary ring-2 ring-primary/20" : "border-transparent"
                    }`}
                  />
                  {CATEGORY_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-8 w-8 rounded-full border-2 ${
                        color === c ? "border-primary ring-2 ring-primary/20" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  キャンセル
                </Button>
                <Button type="submit" disabled={isPending || !name.trim()}>
                  {isPending ? "保存中..." : editingCategory ? "更新" : "追加"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {categories.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">
          カテゴリがありません
        </p>
      ) : (
        <ul className="space-y-2">
          {categories.map((category) => (
            <li
              key={category.id}
              draggable
              onDragStart={(e) => handleDragStart(e, category.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, category.id)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-2 rounded-lg border bg-card p-3 ${
                draggedId === category.id ? "opacity-50" : ""
              }`}
            >
              <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
              {category.color && (
                <span
                  className="h-4 w-4 rounded-full shrink-0"
                  style={{ backgroundColor: category.color }}
                />
              )}
              <span className="flex-1 font-medium">{category.name}</span>
              <span className="text-sm text-muted-foreground">
                {category.itemCount}件
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleOpenDialog(category)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDelete(category)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
