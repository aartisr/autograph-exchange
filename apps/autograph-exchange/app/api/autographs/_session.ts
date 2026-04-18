import { auth } from "@/auth";

export async function requireSessionUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("AUTH_REQUIRED");
  }

  return userId;
}
