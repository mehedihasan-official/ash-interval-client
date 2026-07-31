import type { ApiResponse } from "@/lib/types/resort";

interface UserSyncInput {
  name: string;
  email: string;
}

interface BackendUser {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt?: string;
  updatedAt?: string;
}

function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"
  ).replace(/\/$/, "");
}

const syncedUsers = new Map<string, BackendUser>();
const pendingSyncs = new Map<string, Promise<BackendUser>>();

/**
 * Sends the authenticated Firebase user to the backend.
 * The backend creates the user on first login and returns the existing
 * record on later logins with the same email.
 */
export async function syncUserWithBackend(
  user: UserSyncInput,
): Promise<BackendUser> {
  const email = user.email.trim().toLowerCase();
  const existingSync = pendingSyncs.get(email);
  if (existingSync) return existingSync;

  const syncedUser = syncedUsers.get(email);
  if (syncedUser) return syncedUser;

  const sync = syncUser(user, email);
  pendingSyncs.set(email, sync);
  try {
    const backendUser = await sync;
    syncedUsers.set(email, backendUser);
    return backendUser;
  } finally {
    pendingSyncs.delete(email);
  }
}

async function syncUser(
  user: UserSyncInput,
  email: string,
): Promise<BackendUser> {
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: user.name.trim() || email.split("@")[0],
        email,
      }),
    });
  } catch {
    throw new Error("Could not reach the server while syncing your profile.");
  }

  let body: ApiResponse<BackendUser> | null = null;
  try {
    body = await response.json();
  } catch {
    // The status check below reports a useful error for non-JSON responses.
  }

  if (!response.ok || !body?.success) {
    throw new Error(
      body?.message || "Could not sync your profile with the server.",
    );
  }

  return body.data;
}
