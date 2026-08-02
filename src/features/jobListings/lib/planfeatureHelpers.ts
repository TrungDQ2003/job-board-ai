import { getCurrentOrganization } from "@/services/clerk/lib/getCurrentAuth"
import { getJobListingOrganizationTag } from "../db/cache/jobListings"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { db } from "@/drizzle/db"
import { JobListingTable } from "@/drizzle/schema"
import { and, count, eq } from "drizzle-orm"
import { hasPlanFeature } from "@/services/clerk/lib/planFeatures"

export async function hasReachedMaxPublishedJobListings() {
  const { orgId } = await getCurrentOrganization()
  if (orgId == null) return true

  const count = await getPublishedJobListingsCount(orgId)

  const [has1, has3, has15] = await Promise.all([
    hasPlanFeature("post_1_job_listing"),
    hasPlanFeature("post_3_job_listings"),
    hasPlanFeature("post_15_job_listings"),
  ])

  // If no organization plans/features are configured in Clerk, default to allowing up to 15 posts
  if (!has1 && !has3 && !has15) {
    return count >= 15
  }

  const canPost = [
    has1 && count < 1,
    has3 && count < 3,
    has15 && count < 15,
  ]

  return !canPost.some(Boolean)
}

export async function hasReachedMaxFeaturedJobListings() {
  const { orgId } = await getCurrentOrganization()
  if (orgId == null) return true

  const count = await getFeaturedJobListingsCount(orgId)

  const [has1Featured, hasUnlimitedFeatured] = await Promise.all([
    hasPlanFeature("1_featured_job_listing"),
    hasPlanFeature("unlimited_featured_jobs_listings"),
  ])

  // If no organization plans/features are configured in Clerk, default to allowing up to 5 featured posts
  if (!has1Featured && !hasUnlimitedFeatured) {
    return count >= 5
  }

  const canFeature = [
    has1Featured && count < 1,
    hasUnlimitedFeatured,
  ]

  return !canFeature.some(Boolean)
}

async function getPublishedJobListingsCount(orgId: string) {
  "use cache"
  cacheTag(getJobListingOrganizationTag(orgId))

  const [res] = await db
    .select({ count: count() })
    .from(JobListingTable)
    .where(
      and(
        eq(JobListingTable.organizationId, orgId),
        eq(JobListingTable.status, "published")
      )
    )
  return res?.count ?? 0
}

async function getFeaturedJobListingsCount(orgId: string) {
  "use cache"
  cacheTag(getJobListingOrganizationTag(orgId))

  const [res] = await db
    .select({ count: count() })
    .from(JobListingTable)
    .where(
      and(
        eq(JobListingTable.organizationId, orgId),
        eq(JobListingTable.isFeatured, true)
      )
    )
  return res?.count ?? 0
}
