"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import {
  createCategorySchema,
  updateCategorySchema,
  reorderCategoriesSchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
  type ReorderCategoriesInput,
} from "@/lib/validations/category";

async function verifyGroupAccess(groupId: string) {
  const user = await getCurrentUser();

  const group = await prisma.group.findFirst({
    where: {
      id: groupId,
      OR: [
        { ownerId: user.id },
        { members: { some: { userId: user.id } } },
      ],
    },
  });

  if (!group) {
    throw new Error("グループが見つからないか、アクセス権限がありません");
  }

  return { user, group };
}

export async function getCategories(groupId: string) {
  await verifyGroupAccess(groupId);

  const categories = await prisma.category.findMany({
    where: { groupId },
    include: {
      _count: { select: { items: true } },
    },
    orderBy: { sortOrder: "asc" },
  });

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    sortOrder: c.sortOrder,
    itemCount: c._count.items,
  }));
}

export async function createCategory(groupId: string, input: CreateCategoryInput) {
  await verifyGroupAccess(groupId);
  const validated = createCategorySchema.parse(input);

  const existingCategory = await prisma.category.findUnique({
    where: {
      groupId_name: {
        groupId,
        name: validated.name,
      },
    },
  });

  if (existingCategory) {
    throw new Error("同じ名前のカテゴリが既に存在します");
  }

  const maxSortOrder = await prisma.category.aggregate({
    where: { groupId },
    _max: { sortOrder: true },
  });

  const category = await prisma.category.create({
    data: {
      name: validated.name,
      color: validated.color ?? null,
      sortOrder: (maxSortOrder._max.sortOrder ?? -1) + 1,
      groupId,
    },
  });

  revalidatePath("/");
  return category;
}

export async function updateCategory(categoryId: string, input: UpdateCategoryInput) {
  const user = await getCurrentUser();
  const validated = updateCategorySchema.parse(input);

  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      group: {
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } },
        ],
      },
    },
  });

  if (!category) {
    throw new Error("カテゴリが見つからないか、権限がありません");
  }

  if (validated.name && validated.name !== category.name) {
    const existingCategory = await prisma.category.findUnique({
      where: {
        groupId_name: {
          groupId: category.groupId,
          name: validated.name,
        },
      },
    });

    if (existingCategory) {
      throw new Error("同じ名前のカテゴリが既に存在します");
    }
  }

  const updated = await prisma.category.update({
    where: { id: categoryId },
    data: {
      name: validated.name,
      color: validated.color,
    },
  });

  revalidatePath("/");
  return updated;
}

export async function deleteCategory(categoryId: string) {
  const user = await getCurrentUser();

  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      group: {
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } },
        ],
      },
    },
  });

  if (!category) {
    throw new Error("カテゴリが見つからないか、権限がありません");
  }

  await prisma.category.delete({
    where: { id: categoryId },
  });

  revalidatePath("/");
}

export async function reorderCategories(groupId: string, items: ReorderCategoriesInput) {
  await verifyGroupAccess(groupId);
  const validated = reorderCategoriesSchema.parse(items);

  await prisma.$transaction(
    validated.map((item) =>
      prisma.category.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
    )
  );

  revalidatePath("/");
}
