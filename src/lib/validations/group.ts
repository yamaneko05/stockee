import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().min(1, "グループ名は必須です").max(50, "グループ名は50文字以内です"),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
