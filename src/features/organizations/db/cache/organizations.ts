import { getGlobalTag, getIdTag } from "@/lib/dataCache"
import { revalidateTag } from "next/cache"

export function getOrganizationGlobalTag() {
  return getGlobalTag("organizations")
}

export function getOrganizationIdTag(id: string) {
  return getIdTag("organizations", id)
}

export function revalidateOrganizationCache(id: string) {
  try {
    revalidateTag(getOrganizationGlobalTag())
    revalidateTag(getOrganizationIdTag(id))
  } catch (e) {
    console.warn("revalidateOrganizationCache was called during render phase, skipping revalidation:", e)
  }
}
