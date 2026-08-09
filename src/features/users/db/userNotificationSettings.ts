import { db } from "@/drizzle/db"
import { UserNotificationSettingsTable } from "@/drizzle/schema"
import { revalidateUserNotificationSettingsCache } from "./cache/userNotificationSettings"

export async function insertUserNotificationSettings(
  settings: typeof UserNotificationSettingsTable.$inferInsert,
  { revalidate = true } = {}
) {
  await db
    .insert(UserNotificationSettingsTable)
    .values(settings)
    .onConflictDoNothing()

  if (revalidate) {
    revalidateUserNotificationSettingsCache(settings.userId)
  }
}

export async function updateUserNotificationSettings(
  userId: string,
  settings: Partial<
    Omit<typeof UserNotificationSettingsTable.$inferInsert, "userId">
  >
) {
  await db
    .insert(UserNotificationSettingsTable)
    .values({ ...settings, userId })
    .onConflictDoUpdate({
      target: UserNotificationSettingsTable.userId,
      set: settings,
    })

  revalidateUserNotificationSettingsCache(userId)
}
