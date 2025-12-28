import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1, "カテゴリ名は必須です").max(50, "カテゴリ名は50文字以内で入力してください"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "無効な色形式です").nullable().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const reorderCategoriesSchema = z.array(
  z.object({
    id: z.string().min(1),
    sortOrder: z.number().int().min(0),
  })
);

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ReorderCategoriesInput = z.infer<typeof reorderCategoriesSchema>;

export const CATEGORY_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#6b7280", // gray
] as const;
