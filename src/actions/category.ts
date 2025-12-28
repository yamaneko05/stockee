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

export async function getCategories(groupId?: string | null) {
  const user = await getCurrentUser();

  if (groupId) {
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

  // 個人用カテゴリ
  const categories = await prisma.category.findMany({
    where: { userId: user.id, groupId: null },
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

export async function createCategory(input: CreateCategoryInput, groupId?: string | null) {
  const user = await getCurrentUser();
  const validated = createCategorySchema.parse(input);

  if (groupId) {
    await verifyGroupAccess(groupId);

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

  // 個人用カテゴリ
  const existingCategory = await prisma.category.findUnique({
    where: {
      userId_name: {
        userId: user.id,
        name: validated.name,
      },
    },
  });

  if (existingCategory) {
    throw new Error("同じ名前のカテゴリが既に存在します");
  }

  const maxSortOrder = await prisma.category.aggregate({
    where: { userId: user.id, groupId: null },
    _max: { sortOrder: true },
  });

  const category = await prisma.category.create({
    data: {
      name: validated.name,
      color: validated.color ?? null,
      sortOrder: (maxSortOrder._max.sortOrder ?? -1) + 1,
      userId: user.id,
    },
  });

  revalidatePath("/");
  return category;
}

export async function updateCategory(categoryId: string, input: UpdateCategoryInput) {
  const user = await getCurrentUser();
  const validated = updateCategorySchema.parse(input);

  // グループまたは個人のカテゴリを検索
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      OR: [
        // グループカテゴリ
        {
          groupId: { not: null },
          group: {
            OR: [
              { ownerId: user.id },
              { members: { some: { userId: user.id } } },
            ],
          },
        },
        // 個人カテゴリ
        { userId: user.id, groupId: null },
      ],
    },
  });

  if (!category) {
    throw new Error("カテゴリが見つからないか、権限がありません");
  }

  if (validated.name && validated.name !== category.name) {
    if (category.groupId) {
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
    } else if (category.userId) {
      const existingCategory = await prisma.category.findUnique({
        where: {
          userId_name: {
            userId: category.userId,
            name: validated.name,
          },
        },
      });

      if (existingCategory) {
        throw new Error("同じ名前のカテゴリが既に存在します");
      }
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
      OR: [
        // グループカテゴリ
        {
          groupId: { not: null },
          group: {
            OR: [
              { ownerId: user.id },
              { members: { some: { userId: user.id } } },
            ],
          },
        },
        // 個人カテゴリ
        { userId: user.id, groupId: null },
      ],
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

export async function reorderCategories(items: ReorderCategoriesInput, groupId?: string | null) {
  await getCurrentUser();
  const validated = reorderCategoriesSchema.parse(items);

  if (groupId) {
    await verifyGroupAccess(groupId);
  }

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
