"use server";

import { prisma } from "@/lib/prisma";

export async function checkUserStatus(
  username: string
) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username },
        { email: username },
      ],
    },
    select: {
      status: true,
    },
  });

  if (!user) {
    return {
      exists: false,
      active: false,
    };
  }

  return {
    exists: true,
    active: user.status,
  };
}