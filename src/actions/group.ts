"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { createGroupSchema, type CreateGroupInput } from "@/lib/validations/group";

export async function getGroups() {
  const user = await getCurrentUser();

  const ownedGroups = await prisma.group.findMany({
    where: { ownerId: user.id },
    include: {
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const memberGroups = await prisma.group.findMany({
    where: {
      members: { some: { userId: user.id } },
      ownerId: { not: user.id },
    },
    include: {
      owner: { select: { name: true } },
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return {
    owned: ownedGroups.map((g) => ({
      id: g.id,
      name: g.name,
      inviteCode: g.inviteCode,
      isOwner: true,
      memberCount: g._count.members + 1,
    })),
    joined: memberGroups.map((g) => ({
      id: g.id,
      name: g.name,
      inviteCode: null,
      isOwner: false,
      ownerName: g.owner.name,
      memberCount: g._count.members + 1,
    })),
  };
}

export async function getGroup(id: string) {
  const user = await getCurrentUser();

  const group = await prisma.group.findFirst({
    where: {
      id,
      OR: [
        { ownerId: user.id },
        { members: { some: { userId: user.id } } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      categories: {
        include: {
          _count: { select: { items: true } },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!group) {
    return null;
  }

  return {
    id: group.id,
    name: group.name,
    inviteCode: group.ownerId === user.id ? group.inviteCode : null,
    isOwner: group.ownerId === user.id,
    owner: group.owner,
    members: group.members.map((m) => ({
      id: m.id,
      user: m.user,
      createdAt: m.createdAt,
    })),
    categories: group.categories.map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      sortOrder: c.sortOrder,
      itemCount: c._count.items,
    })),
  };
}

export async function getGroupByInviteCode(inviteCode: string) {
  const group = await prisma.group.findUnique({
    where: { inviteCode },
    include: {
      owner: { select: { name: true } },
      _count: { select: { members: true } },
    },
  });

  if (!group) {
    return null;
  }

  return {
    id: group.id,
    name: group.name,
    ownerName: group.owner.name,
    memberCount: group._count.members + 1,
  };
}

export async function createGroup(input: CreateGroupInput) {
  const user = await getCurrentUser();
  const validated = createGroupSchema.parse(input);

  const group = await prisma.group.create({
    data: {
      name: validated.name,
      ownerId: user.id,
    },
  });

  revalidatePath("/");
  return group;
}

export async function joinGroup(inviteCode: string) {
  const user = await getCurrentUser();

  const group = await prisma.group.findUnique({
    where: { inviteCode },
  });

  if (!group) {
    throw new Error("グループが見つかりません");
  }

  if (group.ownerId === user.id) {
    throw new Error("自分が作成したグループには参加できません");
  }

  const existingMember = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId: group.id,
        userId: user.id,
      },
    },
  });

  if (existingMember) {
    throw new Error("すでにこのグループに参加しています");
  }

  await prisma.groupMember.create({
    data: {
      groupId: group.id,
      userId: user.id,
    },
  });

  revalidatePath("/");
  return group;
}

export async function leaveGroup(groupId: string) {
  const user = await getCurrentUser();

  const group = await prisma.group.findFirst({
    where: { id: groupId },
  });

  if (!group) {
    throw new Error("グループが見つかりません");
  }

  if (group.ownerId === user.id) {
    throw new Error("オーナーはグループを脱退できません。グループを削除してください。");
  }

  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: user.id,
      },
    },
  });

  if (!membership) {
    throw new Error("このグループのメンバーではありません");
  }

  await prisma.groupMember.delete({
    where: { id: membership.id },
  });

  revalidatePath("/");
}

export async function deleteGroup(groupId: string) {
  const user = await getCurrentUser();

  const group = await prisma.group.findFirst({
    where: {
      id: groupId,
      ownerId: user.id,
    },
  });

  if (!group) {
    throw new Error("グループが見つからないか、削除権限がありません");
  }

  await prisma.group.delete({
    where: { id: groupId },
  });

  revalidatePath("/");
}

export async function removeMember(groupId: string, memberId: string) {
  const user = await getCurrentUser();

  const group = await prisma.group.findFirst({
    where: {
      id: groupId,
      ownerId: user.id,
    },
  });

  if (!group) {
    throw new Error("グループが見つからないか、権限がありません");
  }

  const membership = await prisma.groupMember.findFirst({
    where: {
      id: memberId,
      groupId,
    },
  });

  if (!membership) {
    throw new Error("メンバーが見つかりません");
  }

  await prisma.groupMember.delete({
    where: { id: memberId },
  });

  revalidatePath("/groups/" + groupId);
}

export async function regenerateInviteCode(groupId: string) {
  const user = await getCurrentUser();

  const group = await prisma.group.findFirst({
    where: {
      id: groupId,
      ownerId: user.id,
    },
  });

  if (!group) {
    throw new Error("グループが見つからないか、権限がありません");
  }

  const updated = await prisma.group.update({
    where: { id: groupId },
    data: {
      inviteCode: crypto.randomUUID().replace(/-/g, "").slice(0, 16),
    },
  });

  revalidatePath("/groups/" + groupId);
  return updated.inviteCode;
}
