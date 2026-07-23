import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { redirect } from "next/navigation"
import { OnboardingClient } from "./_client"
import { headers } from "next/headers"
import { currentUser } from "@clerk/nextjs/server"
import { db } from "@/drizzle/db"
import { UserTable, UserNotificationSettingsTable } from "@/drizzle/schema"

export default async function OnboardingPage() {
  await headers()
  const { userId, user } = await getCurrentUser({ allData: true })

  if (userId == null) return redirect("/")
  if (user != null) return redirect("/app")

  // Fallback auto-sync for local development when Clerk Webhooks are not configured/reachable
  const clerkUser = await currentUser()
  if (clerkUser != null) {
    const email = clerkUser.emailAddresses.find(
      e => e.id === clerkUser.primaryEmailAddressId
    )?.emailAddress

    if (email != null) {
      await db.insert(UserTable).values({
        id: clerkUser.id,
        name: `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || "User",
        imageUrl: clerkUser.imageUrl,
        email: email,
        createdAt: new Date(clerkUser.createdAt),
        updatedAt: new Date(clerkUser.updatedAt),
      }).onConflictDoNothing()

      await db.insert(UserNotificationSettingsTable).values({
        userId: clerkUser.id,
      }).onConflictDoNothing()

      return redirect("/app")
    }
  }

  return (
    <div className="container flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-4xl">Creating your account...</h1>
      <OnboardingClient userId={userId} />
    </div>
  )
}
