import { auth } from "@/auth";

function parseAdminEmails(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAutographAdminUserId(userId: string): boolean {
  const adminEmails = parseAdminEmails(process.env.AUTOGRAPH_ADMIN_EMAILS ?? process.env.ADMIN_EMAILS);
  return adminEmails.has(userId.trim().toLowerCase());
}

export async function requireSessionUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("AUTH_REQUIRED");
  }

  return userId;
}

export async function requireAdminSessionUserId(): Promise<string> {
  const userId = await requireSessionUserId();

  if (!isAutographAdminUserId(userId)) {
    throw new Error("ADMIN_REQUIRED");
  }

  return userId;
}
