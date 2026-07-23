import { prisma } from "@/lib/prisma";
import { ActivityType } from "@prisma/client";

export async function logActivity(
  type: ActivityType,
  description: string,
  id_user?: number
) {
  await prisma.activityLog.create({
    data: {
      type,
      description,
      id_user,
    },
  });
}