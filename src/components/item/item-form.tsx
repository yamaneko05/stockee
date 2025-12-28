"use client";

import { useTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createItemSchema,
  type CreateItemInput,
} from "@/lib/validations/item";
import { createItem, updateItem } from "@/actions/item";
import { getCategories } from "@/actions/category";
import { useGroup } from "@/contexts/group-context";
import type { ItemModel } from "@/generated/prisma/models/Item";

const UNITS = ["個", "本", "箱", "パック", "袋", "枚"] as const;

type Category = {
  id: string;
  name: string;
  color: string | null;
};

type ItemFormProps = {
  item?: ItemModel & { categoryId?: string | null };
};

export function ItemForm({ item }: ItemFormProps) {
  const { selectedGroupId } = useGroup();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState<Category[]>([]);
  const isEditing = !!item;

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateItemInput>({
    resolver: zodResolver(createItemSchema),
    defaultValues: {
      name: item?.name ?? "",
      productName: item?.productName ?? "",
      price: item?.price ?? undefined,
      quantity: item?.quantity ?? 0,
      unit: item?.unit ?? "個",
      note: item?.note ?? "",
      threshold: item?.threshold ?? undefined,
      categoryId: item?.categoryId ?? null,
    },
  });

  const currentUnit = useWatch({ control, name: "unit" });
  const currentCategoryId = useWatch({ control, name: "categoryId" });

  useEffect(() => {
    // グループ選択時はグループのカテゴリ、未選択時は個人のカテゴリを取得
    getCategories(selectedGroupId).then(setCategories);
  }, [selectedGroupId]);

  const onSubmit = (data: CreateItemInput) => {
    startTransition(async () => {
      if (isEditing) {
        await updateItem(item.id, data);
      } else {
        await createItem(data, selectedGroupId);
      }
      router.push("/");
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">
          品目名 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          {...register("name")}
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="productName">商品名</Label>
        <Input id="productName" {...register("productName")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">価格（円）</Label>
        <Input
          id="price"
          type="number"
          min="0"
          {...register("price", {
            setValueAs: (v) => (v === "" ? undefined : parseInt(v, 10)),
          })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">
            在庫数 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="quantity"
            type="number"
            min="0"
            {...register("quantity", { valueAsNumber: true })}
            aria-invalid={!!errors.quantity}
          />
          {errors.quantity && (
            <p className="text-sm text-destructive">{errors.quantity.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit">
            単位 <span className="text-destructive">*</span>
          </Label>
          <Select
            value={currentUnit}
            onValueChange={(value) => setValue("unit", value)}
          >
            <SelectTrigger id="unit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNITS.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.unit && (
            <p className="text-sm text-destructive">{errors.unit.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="threshold">在庫閾値</Label>
        <Input
          id="threshold"
          type="number"
          min="0"
          placeholder="設定なし"
          {...register("threshold", {
            setValueAs: (v) => (v === "" ? null : parseInt(v, 10)),
          })}
          aria-invalid={!!errors.threshold}
        />
        <p className="text-xs text-muted-foreground">
          この数量以下になると警告を表示します
        </p>
        {errors.threshold && (
          <p className="text-sm text-destructive">{errors.threshold.message}</p>
        )}
      </div>

      {categories.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="category">カテゴリ</Label>
          <Select
            value={currentCategoryId ?? "none"}
            onValueChange={(value) => setValue("categoryId", value === "none" ? null : value)}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="カテゴリを選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">未分類</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <span className="flex items-center gap-2">
                    {category.color && (
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                    )}
                    {category.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="note">備考</Label>
        <Textarea id="note" rows={3} {...register("note")} />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "保存中..." : isEditing ? "更新する" : "登録する"}
      </Button>
    </form>
  );
}
