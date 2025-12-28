"use client";

import { useTransition } from "react";
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
import { useGroup } from "@/contexts/group-context";
import type { ItemModel } from "@/generated/prisma/models/Item";

const UNITS = ["個", "本", "箱", "パック", "袋", "枚"] as const;

type ItemFormProps = {
  item?: ItemModel;
};

export function ItemForm({ item }: ItemFormProps) {
  const { selectedGroupId } = useGroup();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
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
    },
  });

  const currentUnit = useWatch({ control, name: "unit" });

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
          {...register("price", { valueAsNumber: true })}
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
