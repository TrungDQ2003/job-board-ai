"use server"

import { getCurrentOrganization } from "@/services/clerk/lib/getCurrentAuth"
import { updateOrganization } from "../db/organizations"

export async function upgradeOrganizationPlan(plan: "starter" | "pro" | "enterprise") {
  const { orgId } = await getCurrentOrganization()
  
  if (orgId == null) {
    return {
      error: true,
      message: "No active organization found",
    }
  }

  try {
    await updateOrganization(orgId, { plan })
    return { error: false }
  } catch (e) {
    console.error("Failed to upgrade organization plan:", e)
    return {
      error: true,
      message: "Failed to upgrade plan",
    }
  }
}
