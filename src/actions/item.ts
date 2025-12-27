"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import {
  createItemSchema,
  updateItemSchema,
  reorderItemsSchema,
  type CreateItemInput,
  type UpdateItemInput,
  type ReorderItemsInput,
} from "@/lib/validations/item";

async function verifyGroupAccess(userId: string, groupId: string) {
  const group = await prisma.group.findFirst({
    where: {
      id: groupId,
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    },
  });
  return !!group;
}

async function verifyItemAccess(userId: string, itemId: string) {
  const item = await prisma.item.findFirst({
    where: { id: itemId },
  });

  if (!item) return null;

  if (item.groupId) {
    const hasAccess = await verifyGroupAccess(userId, item.groupId);
    if (!hasAccess) return null;
  } else if (item.userId !== userId) {
    return null;
  }

  return item;
}

export async function getItems(groupId?: string | null) {
  const user = await getCurrentUser();

  if (groupId) {
    const hasAccess = await verifyGroupAccess(user.id, groupId);
    if (!hasAccess) {
      throw new Error("グループへのアクセス権がありません");
    }
    return prisma.item.findMany({
      where: { groupId },
      orderBy: { sortOrder: "asc" },
    });
  }

  return prisma.item.findMany({
    where: { userId: user.id, groupId: null },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getItem(id: string) {
  const user = await getCurrentUser();
  return verifyItemAccess(user.id, id);
}

export async function createItem(input: CreateItemInput, groupId?: string | null) {
  const user = await getCurrentUser();
  const validated = createItemSchema.parse(input);

  if (groupId) {
    const hasAccess = await verifyGroupAccess(user.id, groupId);
    if (!hasAccess) {
      throw new Error("グループへのアクセス権がありません");
    }

    const maxSortOrder = await prisma.item.aggregate({
      where: { groupId },
      _max: { sortOrder: true },
    });

    const item = await prisma.item.create({
      data: {
        ...validated,
        sortOrder: (maxSortOrder._max.sortOrder ?? -1) + 1,
        groupId,
      },
    });

    revalidatePath("/");
    return item;
  }

  const maxSortOrder = await prisma.item.aggregate({
    where: { userId: user.id, groupId: null },
    _max: { sortOrder: true },
  });

  const item = await prisma.item.create({
    data: {
      ...validated,
      sortOrder: (maxSortOrder._max.sortOrder ?? -1) + 1,
      userId: user.id,
    },
  });

  revalidatePath("/");
  return item;
}

export async function updateItem(id: string, input: UpdateItemInput) {
  const user = await getCurrentUser();
  const validated = updateItemSchema.parse(input);

  const existing = await verifyItemAccess(user.id, id);
  if (!existing) {
    throw new Error("Item not found");
  }

  const item = await prisma.item.update({
    where: { id },
    data: validated,
  });

  revalidatePath("/");
  return item;
}

export async function deleteItem(id: string) {
  const user = await getCurrentUser();

  const existing = await verifyItemAccess(user.id, id);
  if (!existing) {
    throw new Error("Item not found");
  }

  await prisma.item.delete({
    where: { id },
  });

  revalidatePath("/");
}

export async function incrementStock(id: string) {
  const user = await getCurrentUser();

  const existing = await verifyItemAccess(user.id, id);
  if (!existing) {
    throw new Error("Item not found");
  }

  const item = await prisma.item.update({
    where: { id },
    data: {
      quantity: { increment: 1 },
    },
  });

  revalidatePath("/");
  return item;
}

export async function decrementStock(id: string) {
  const user = await getCurrentUser();

  const existing = await verifyItemAccess(user.id, id);
  if (!existing) {
    throw new Error("Item not found");
  }

  if (existing.quantity <= 0) {
    throw new Error("Stock cannot be negative");
  }

  const item = await prisma.item.update({
    where: { id },
    data: {
      quantity: { decrement: 1 },
    },
  });

  revalidatePath("/");
  return item;
}

export async function reorderItems(input: ReorderItemsInput, groupId?: string | null) {
  const user = await getCurrentUser();
  const validated = reorderItemsSchema.parse(input);

  if (groupId) {
    const hasAccess = await verifyGroupAccess(user.id, groupId);
    if (!hasAccess) {
      throw new Error("グループへのアクセス権がありません");
    }
  }

  const itemIds = validated.map((item) => item.id);
  const existingItems = await prisma.item.findMany({
    where: {
      id: { in: itemIds },
      ...(groupId ? { groupId } : { userId: user.id, groupId: null }),
    },
    select: { id: true },
  });

  const existingIds = new Set(existingItems.map((item) => item.id));
  const allBelongToUser = itemIds.every((id) => existingIds.has(id));

  if (!allBelongToUser) {
    throw new Error("Some items not found or do not belong to user");
  }

  await prisma.$transaction(
    validated.map((item) =>
      prisma.item.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
    )
  );

  revalidatePath("/");
}
