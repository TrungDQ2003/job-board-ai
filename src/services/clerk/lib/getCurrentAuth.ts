import { db } from "@/drizzle/db"
import { OrganizationTable, UserTable } from "@/drizzle/schema"
import { getOrganizationIdTag } from "@/features/organizations/db/cache/organizations"
import { getUserIdTag } from "@/features/users/db/cache/users"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { eq } from "drizzle-orm"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"

export async function getCurrentUser({ allData = false } = {}) {
  const { userId } = await auth()

  let user = undefined
  if (allData && userId != null) {
    user = await getUser(userId)
    if (user == null) {
      try {
        const client = await clerkClient()
        const clerkUser = await client.users.getUser(userId)
        if (clerkUser != null) {
          const email = clerkUser.emailAddresses.find(
            e => e.id === clerkUser.primaryEmailAddressId
          )?.emailAddress
          if (email != null) {
            const { insertUser } = await import("@/features/users/db/users")
            const userData = {
              id: userId,
              name: `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || "User",
              imageUrl: clerkUser.imageUrl,
              email: email,
              createdAt: new Date(clerkUser.createdAt),
              updatedAt: new Date(clerkUser.updatedAt),
            }
            await insertUser(userData)
            const { insertUserNotificationSettings } = await import("@/features/users/db/userNotificationSettings")
            await insertUserNotificationSettings({ userId })
            user = userData
          }
        }
      } catch (e) {
        console.error("Clerk user sync error:", e)
      }
    }
  }

  return {
    userId,
    user,
  }
}

export async function getCurrentOrganization({ allData = false } = {}) {
  const { orgId, userId } = await auth()

  let organization = undefined
  if (allData && orgId != null) {
    organization = await getOrganization(orgId)
    if (organization == null) {
      try {
        const client = await clerkClient()
        const clerkOrg = await client.organizations.getOrganization({ organizationId: orgId })
        if (clerkOrg != null) {
          const { insertOrganization } = await import("@/features/organizations/db/organizations")
          const orgData = {
            id: orgId,
            name: clerkOrg.name,
            imageUrl: clerkOrg.imageUrl,
            plan: "starter" as const,
            createdAt: new Date(clerkOrg.createdAt),
            updatedAt: new Date(clerkOrg.updatedAt),
          }
          await insertOrganization(orgData)
          if (userId != null) {
            const { insertOrganizationUserSettings } = await import("@/features/organizations/db/organizationUserSettings")
            await insertOrganizationUserSettings({
              userId,
              organizationId: orgId,
            })
          }
          organization = orgData
        }
      } catch (e) {
        console.error("Clerk organization sync error:", e)
      }
    }
  }

  return {
    orgId,
    organization,
  }
}

async function getUser(id: string) {
  "use cache"
  cacheTag(getUserIdTag(id))

  return db.query.UserTable.findFirst({
    where: eq(UserTable.id, id),
  })
}

async function getOrganization(id: string) {
  "use cache"
  cacheTag(getOrganizationIdTag(id))

  return db.query.OrganizationTable.findFirst({
    where: eq(OrganizationTable.id, id),
  })
}

