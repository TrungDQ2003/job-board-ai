import { getGlobalTag, getIdTag } from "@/lib/dataCache"
import { revalidateTag } from "next/cache"

export function getUserGlobalTag() {
  return getGlobalTag("users")
}

export function getUserIdTag(id: string) {
  return getIdTag("users", id)
}

export function revalidateUserCache(id: string) {
  try {
    revalidateTag(getUserGlobalTag())
    revalidateTag(getUserIdTag(id))
  } catch (e) {
    console.warn("revalidateUserCache was called during render phase, skipping revalidation:", e)
  }
}
