import { z } from "zod";

export const createItemSchema = z.object({
  name: z.string().min(1, "品目名は必須です"),
  productName: z.string().optional(),
  price: z.number().int().min(0).optional(),
  quantity: z.number().int().min(0, "在庫数は0以上である必要があります"),
  unit: z.string().min(1, "単位は必須です"),
  note: z.string().optional(),
  threshold: z.number().int().min(0, "閾値は0以上である必要があります").nullable().optional(),
  categoryId: z.string().nullable().optional(),
});

export const updateItemSchema = createItemSchema.partial();

export const reorderItemsSchema = z.array(
  z.object({
    id: z.string().min(1),
    sortOrder: z.number().int().min(0),
  })
);

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type ReorderItemsInput = z.infer<typeof reorderItemsSchema>;
