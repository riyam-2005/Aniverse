import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk, withApiHandler } from "@/lib/api";

export const POST = withApiHandler(async () => {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return apiError("Not signed in", 401, "UNAUTHENTICATED");
  }

  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });

  return apiOk({ ok: true, message: "All notifications marked as read." });
});
