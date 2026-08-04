import { db } from "@/drizzle/db"
import { OrganizationTable } from "@/drizzle/schema"
import { auth } from "@clerk/nextjs/server"
import { eq } from "drizzle-orm"

type PlanFeature =
  | "post_1_job_listing"
  | "post_3_job_listings"
  | "post_15_job_listings"
  | "unlimited_featured_jobs_listings"
  | "1_featured_job_listing"

export async function hasPlanFeature(feature: PlanFeature) {
  const { has, orgId } = await auth()
  if (has({ feature })) return true

  if (orgId == null) return false

  try {
    const org = await db.query.OrganizationTable.findFirst({
      where: eq(OrganizationTable.id, orgId),
      columns: { plan: true },
    })

    const plan = org?.plan ?? "starter"

    if (plan === "pro") {
      return (
        feature === "post_15_job_listings" ||
        feature === "unlimited_featured_jobs_listings"
      )
    }

    if (plan === "enterprise") {
      return true
    }

    if (plan === "starter") {
      return (
        feature === "post_1_job_listing" ||
        feature === "1_featured_job_listing"
      )
    }
  } catch (e) {
    console.error("Failed to fetch organization plan for feature check:", e)
  }

  return false
}
